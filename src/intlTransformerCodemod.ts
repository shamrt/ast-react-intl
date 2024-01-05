import { PropertyKind } from 'ast-types/gen/kinds';
import {
  API,
  CallExpression,
  ConditionalExpression,
  FileInfo,
  JSCodeshift,
  JSXElement,
  JSXExpressionContainer,
  Options,
} from 'jscodeshift';
import { Collection } from 'jscodeshift/src/Collection';
import { NodePath } from 'ast-types/lib/node-path';
import {
  isWhitespace,
  canHandleAttribute,
  attributeLooksLikeText,
  findFunctionByIdentifier,
} from './helpers/jscodeshift';
import { hasStringLiteralArguments } from './visitorChecks';
import {
  getTextWithPlaceholders,
  generateIntlCall,
  addUseHookToFunctionBody,
  createUseIntlCall,
  addI18nImport,
} from './helpers/formatjs';

// <span>test</span>
// <span>test {value}</span>
// <span>{predicate ? 'ok' : 'not ok'}</span>
function translateJsxContent(j: JSCodeshift, root: Collection<unknown>) {
  let usedTranslation = false;

  root.find(j.JSXElement).forEach((path: NodePath<JSXElement>) => {
    const oldChildren = path.value.children;
    const [newText, newValues, hasI18nUsage] = getTextWithPlaceholders(
      j,
      oldChildren,
    );
    usedTranslation = usedTranslation || hasI18nUsage;

    if (!hasI18nUsage) {
      return;
    }

    const newChildren = [
      j.jsxExpressionContainer(generateIntlCall(j, newText, newValues)),
    ];
    if (newChildren.length > 0) {
      path.replace(
        j.jsxElement(
          path.node.openingElement,
          path.node.closingElement,
          newChildren,
        ),
      );
    }
  });

  root
    .find(j.JSXText)
    .filter((path) => !isWhitespace(path.value.value))
    .forEach((path) => {
      usedTranslation = true;
      const oldChildren = path.parent.node.children;
      const [newText, newValues] = getTextWithPlaceholders(j, oldChildren);
      // eslint-disable-next-line no-param-reassign
      path.parent.node.children = [
        j.jsxExpressionContainer(generateIntlCall(j, newText, newValues)),
      ];
    });

  return usedTranslation;
}

function translateJsxProps(j: JSCodeshift, root: Collection<unknown>) {
  let hasI18nUsage = false;
  root
    .find(j.JSXAttribute)
    .filter((path) => canHandleAttribute(path) && attributeLooksLikeText(path))
    .forEach((path) => {
      // @ts-expect-error: TypeScript thinks `value` is undefined, but that's wrong
      const [text, params] = getTextWithPlaceholders(j, [path.value.value]);
      if (isWhitespace(text || '')) {
        return;
      }

      hasI18nUsage = true;
      const callExpression = j.jsxExpressionContainer(
        generateIntlCall(j, text, params),
      );

      if (path?.value?.value) {
        // eslint-disable-next-line no-param-reassign
        path.value.value = callExpression;
      }
    });

  // <Comp name={'Awesome'} />
  root
    .find(j.JSXExpressionContainer)
    .filter(
      (path: NodePath<JSXExpressionContainer>) =>
        path.node.expression && j.StringLiteral.check(path.node.expression),
    )
    .forEach((path) => {
      hasI18nUsage = true;

      // @ts-expect-error: TypeScript thinks `expression` has no `value` property, but that's wrong
      const text = path.node.expression.value;
      // eslint-disable-next-line no-param-reassign
      path.node.expression = generateIntlCall(j, text);
    });

  return hasI18nUsage;
}

// <span>{bool ? 'aaa' : 'bbb'}</span>
// <Comp name={bool ? 'aaa' : 'bbb'} />
function translateConditionalExpressions(
  j: JSCodeshift,
  root: Collection<unknown>,
) {
  let hasI18nUsage = false;

  root
    .find(j.JSXExpressionContainer)
    .filter(
      (path: NodePath<JSXExpressionContainer>) =>
        path.node.expression &&
        j.ConditionalExpression.check(path.node.expression) &&
        (j.JSXElement.check(path.parent.node) ||
          j.JSXAttribute.check(path.parent.node)),
    )
    // @ts-expect-error: We've just filtered for `path`s as conditional expressions
    .forEach((path: NodePath<ConditionalExpression>) => {
      const { expression } = path.value;
      if (j.Literal.check(expression.consequent)) {
        hasI18nUsage = true;
        const text = expression.consequent.value;
        expression.consequent = generateIntlCall(j, text);
      }
      if (j.Literal.check(expression.alternate)) {
        hasI18nUsage = true;
        const text = expression.alternate.value;
        expression.alternate = generateIntlCall(j, text);
      }
    });

  return hasI18nUsage;
}

// Yup.string().required('this field is required')
// showSnackbar({ message: 'ok' })
function translateFunctionArguments(j: JSCodeshift, root: Collection<unknown>) {
  let hasI18nUsage = false;

  root
    .find(j.CallExpression)
    .filter(
      (path: NodePath<CallExpression, CallExpression>) =>
        // @ts-expect-error: Ignoring `name` not existing on some types
        !['classNames'].includes(path.value.callee.name),
    )
    .filter((path: NodePath<CallExpression>) => hasStringLiteralArguments(path))
    .forEach((path: NodePath<CallExpression, CallExpression>) => {
      if (hasStringLiteralArguments(path)) {
        // eslint-disable-next-line no-param-reassign
        path.node.arguments = path.node.arguments.map((arg) => {
          if (arg.type === 'StringLiteral' && arg.value) {
            hasI18nUsage = true;
            const [newText, newValues] = getTextWithPlaceholders(j, [arg]);
            return generateIntlCall(j, newText, newValues);
          }

          if (arg.type === 'ObjectExpression') {
            // @ts-expect-error: Don't care that property 'argument' is missing in type 'CallExpression'
            // eslint-disable-next-line no-param-reassign
            arg.properties = arg.properties.map((prop: PropertyKind) => {
              if (prop.value && prop.value.type === 'StringLiteral') {
                hasI18nUsage = true;
                const [newText, newValues] = getTextWithPlaceholders(j, [
                  prop.value,
                ]);
                // eslint-disable-next-line no-param-reassign
                prop.value = generateIntlCall(j, newText, newValues);
              }
              return prop;
            });
          }

          return arg;
        });
      }
    });

  return hasI18nUsage;
}

/**
 * Main function called by jscodeshift.
 */
function transform(file: FileInfo, api: API, options: Options) {
  const j = api.jscodeshift; // alias the jscodeshift API
  if (file.path.endsWith('.spec.js') || file.path.endsWith('.test.js')) {
    return undefined;
  }
  const root = j(file.source); // parse JS code into an AST

  const printOptions: Options = options.printOptions ?? {
    quote: 'single',
    trailingComma: false,
    lineTerminator: '\n',
  };

  let hasI18nUsage = false;

  hasI18nUsage = translateJsxProps(j, root) || hasI18nUsage;
  hasI18nUsage = translateJsxContent(j, root) || hasI18nUsage;
  hasI18nUsage = translateConditionalExpressions(j, root) || hasI18nUsage;
  hasI18nUsage = translateFunctionArguments(j, root) || hasI18nUsage;

  if (hasI18nUsage) {
    let hooksUsed = false;

    root
      .find(j.ExportDefaultDeclaration)
      .filter((path) => {
        const exportDeclaration = path.node.declaration;
        return (
          j.Identifier.check(exportDeclaration) ||
          j.CallExpression.check(exportDeclaration) ||
          j.FunctionDeclaration.check(exportDeclaration)
        );
      })
      .forEach((path) => {
        const exportDeclaration = path.node.declaration;

        if (j.Identifier.check(exportDeclaration)) {
          const exportedName = exportDeclaration.name;
          const functions = findFunctionByIdentifier(j, exportedName, root);

          addUseHookToFunctionBody(j, functions);
          hooksUsed = true;

          return;
        }

        if (j.CallExpression.check(exportDeclaration)) {
          exportDeclaration.arguments.forEach((arg) => {
            if (j.Identifier.check(arg)) {
              const functions = findFunctionByIdentifier(j, arg.name, root);
              hooksUsed = addUseHookToFunctionBody(j, functions) || hooksUsed;
            }
          });
        } else if (j.FunctionDeclaration.check(exportDeclaration)) {
          hooksUsed = true;
          exportDeclaration.body = j.blockStatement([
            createUseIntlCall(j),
            ...exportDeclaration.body.body,
          ]);
        }
      });

    addI18nImport(j, root, { hooksUsed });
    return root.toSource(printOptions);
  }

  return undefined;
}

module.exports = transform;
module.exports.parser = 'tsx';
