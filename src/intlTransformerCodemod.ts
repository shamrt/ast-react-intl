import {
  API,
  CallExpression,
  ConditionalExpression,
  FileInfo,
  Identifier,
  JSCodeshift,
  JSXElement,
  JSXExpressionContainer,
  ObjectProperty,
  Options,
} from 'jscodeshift';
import { Collection } from 'jscodeshift/src/Collection';
import { NodePath } from 'ast-types/lib/node-path';
import {
  isWhitespace,
  canHandleAttribute,
  attributeLooksLikeText,
  findFunctionByIdentifier,
  looksLikeTextPropName,
} from './helpers/jscodeshift';
import { hasStringLiteralArguments } from './visitorChecks';
import {
  getTextWithPlaceholders,
  generateIntlCall,
  addUseHookToFunctionBody,
  createUseIntlCall,
  addI18nImport,
  generateFormattedMessageComponent,
} from './helpers/formatjs';

/**
 * Translates simple JSX content.
 *
 * @example
 * // Before
 * <span>test</span>
 * <span>test {value}</span>
 * // After
 * <span><FormattedMessage defaultMessage="test" /></span>
 * <span><FormattedMessage defaultMessage="test {value}" values={{ value }} /></span>
 */
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

    const newComponent = [
      generateFormattedMessageComponent(j, newText, newValues),
    ];
    if (newComponent.length > 0) {
      path.replace(
        j.jsxElement(
          path.node.openingElement,
          path.node.closingElement,
          newComponent,
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

/**
 * Translates conditional expressions that are used as JSX content.
 *
 * @example
 * // Before
 * <span>{bool ? 'aaa' : 'bbb'}</span>
 * <Comp title={bool ? 'aaa' : 'bbb'} />
 * // After
 * <span>{bool ? intl.formatMessage({ defaultMessage: 'aaa' }) : intl.formatMessage({ defaultMessage: 'bbb' })}</span>
 * <Comp title={bool ? intl.formatMessage({ defaultMessage: 'aaa' }) : intl.formatMessage({ defaultMessage: 'bbb' })} />
 */
function translateConditionalExpressions(
  j: JSCodeshift,
  root: Collection<unknown>,
) {
  let hasI18nUsage = false;

  root
    .find(j.JSXExpressionContainer)
    .filter((path: NodePath<JSXExpressionContainer>) => {
      const isConditionalExpression =
        path.node.expression &&
        j.ConditionalExpression.check(path.node.expression);
      const isParentElement = j.JSXElement.check(path.parent.node);
      const isParentTextProp =
        j.JSXAttribute.check(path.parent.node) &&
        looksLikeTextPropName(path.parent.value?.name.name);
      return isConditionalExpression && (isParentElement || isParentTextProp);
    })
    // @ts-expect-error: We've just filtered for `path`s as conditional expressions
    .forEach((path: NodePath<ConditionalExpression>) => {
      const { expression } = path.value;
      if (j.StringLiteral.check(expression.consequent)) {
        hasI18nUsage = true;
        const text = expression.consequent.value;
        expression.consequent = generateIntlCall(j, text);
      }
      if (j.StringLiteral.check(expression.alternate)) {
        hasI18nUsage = true;
        const text = expression.alternate.value;
        expression.alternate = generateIntlCall(j, text);
      }
    });

  return hasI18nUsage;
}

/**
 * Translates function arguments that are strings.
 *
 * @example
 * // Before
 * Yup.string().required('this field is required')
 * showSnackbar({ message: 'ok' })
 * // After
 * Yup.string().required(intl.formatMessage({ defaultMessage: 'this field is required' }))
 * showSnackbar({ message: intl.formatMessage({ defaultMessage: 'ok' }) })
 */
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
      // eslint-disable-next-line no-param-reassign
      path.node.arguments = path.node.arguments.map((arg) => {
        if (j.StringLiteral.check(arg) && arg.value) {
          hasI18nUsage = true;
          const [newText, newValues] = getTextWithPlaceholders(j, [arg]);
          return generateIntlCall(j, newText, newValues);
        }

        if (j.ObjectExpression.check(arg)) {
          // @ts-expect-error: Don't care that property 'argument' is missing in type 'CallExpression'
          // eslint-disable-next-line no-param-reassign
          arg.properties = arg.properties.map((prop: ObjectProperty) => {
            if (
              looksLikeTextPropName((prop.key as Identifier).name) &&
              prop.value &&
              prop.value.type === 'StringLiteral'
            ) {
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
  let hooksUsed = false;

  hooksUsed = translateJsxProps(j, root);
  hasI18nUsage = hooksUsed || hasI18nUsage;

  const componentUsed = translateJsxContent(j, root);
  hasI18nUsage = componentUsed || hasI18nUsage;

  hooksUsed =
    translateConditionalExpressions(j, root) ||
    translateFunctionArguments(j, root) ||
    hooksUsed;
  hasI18nUsage = hooksUsed || hasI18nUsage;

  if (hasI18nUsage) {
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

          if (hooksUsed) {
            addUseHookToFunctionBody(j, functions);
          }
          return;
        }

        if (j.CallExpression.check(exportDeclaration)) {
          exportDeclaration.arguments.forEach((arg) => {
            if (j.Identifier.check(arg)) {
              const functions = findFunctionByIdentifier(j, arg.name, root);

              if (hooksUsed) {
                addUseHookToFunctionBody(j, functions);
              }
            }
          });
        } else if (j.FunctionDeclaration.check(exportDeclaration)) {
          const existingUseIntlCalls = j(exportDeclaration.body).find(
            j.CallExpression,
            { callee: { name: 'useIntl' } },
          );
          if (existingUseIntlCalls.length > 0) {
            return;
          }

          exportDeclaration.body = j.blockStatement([
            createUseIntlCall(j),
            ...exportDeclaration.body.body,
          ]);
        }
      });

    addI18nImport(j, root, { hooksUsed, componentUsed });
    return root.toSource(printOptions);
  }

  return undefined;
}

module.exports = transform;
module.exports.parser = 'tsx';
