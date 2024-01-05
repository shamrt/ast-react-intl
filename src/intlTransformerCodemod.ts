import { ASTNode } from 'ast-types';
import { LiteralKind, PropertyKind } from 'ast-types/gen/kinds';
import {
  API,
  CallExpression,
  ConditionalExpression,
  FileInfo,
  Identifier,
  JSCodeshift,
  JSXElement,
  JSXExpressionContainer,
  JSXFragment,
  JSXIdentifier,
  JSXText,
  MemberExpression,
  Options,
  Property,
  StringLiteral,
} from 'jscodeshift';
import { Collection } from 'jscodeshift/src/Collection';
import { NodePath } from 'ast-types/lib/node-path';
import {
  collapseInternalSpace,
  isWhitespace,
  canHandleAttribute,
  attributeLooksLikeText,
  findFunctionByIdentifier,
} from './helpers';
import { hasStringLiteralArguments } from './visitorChecks';

type ImportStatementOptions = {
  componentUsed?: boolean;
  hooksUsed?: boolean;
  injectUsed?: boolean;
};

/** Returns an import statement for react-intl. */
const getImportStatement = ({
  componentUsed = false,
  hooksUsed = false,
  injectUsed = false,
}: ImportStatementOptions = {}) => {
  const namedImports = [];
  if (componentUsed) {
    namedImports.push('FormattedMessage');
  }
  if (hooksUsed) {
    namedImports.push('useIntl');
  }
  if (injectUsed) {
    namedImports.push('injectIntl');
  }
  if (namedImports.length > 0) {
    return `import { ${namedImports.join(', ')} } from 'react-intl';`;
  }
  return '';
};

/** Adds an import statement for react-intl. */
const addI18nImport = (
  j: JSCodeshift,
  root: Collection<unknown>,
  importStatementOptions: ImportStatementOptions,
) => {
  const statement = getImportStatement(importStatementOptions);

  const reactIntlImports = root
    .find(j.ImportDeclaration)
    .filter((path) => path.node.source.value === 'react-intl');

  if (reactIntlImports.length > 0) {
    return;
  }

  const imports = root.find(j.ImportDeclaration);

  if (imports.length > 0) {
    j(imports.at(imports.length - 1).get()).insertAfter(statement); // after the imports
  } else {
    root.get().node.program.body.unshift(statement); // beginning of file
  }
};

/** Generates a safe parameter name in a FormatJS message descriptor. */
const generateArgName = (expression: ASTNode, idx: number): string => {
  if (expression.type === 'Identifier') {
    return (expression as Identifier).name;
  }
  if (expression.type === 'MemberExpression') {
    return generateArgName((expression as MemberExpression).property, idx);
  }
  return `arg${idx}`;
};

/** Generates a safe tag name for a FormatJS message descriptor. */
const generateTagName = (element: JSXElement, idx: number): string => {
  if ((element?.openingElement?.name as JSXIdentifier).name) {
    return (element.openingElement.name as JSXIdentifier).name + idx;
  }

  return `tag${idx}`;
};

/** Generates a simple property for a FormatJS message descriptor. */
const generateArgProps = (
  j: JSCodeshift,
  expression: JSXExpressionContainer,
  argName: string,
): Property => j.property('init', j.literal(argName), expression);

/** Generates an arrow function property for a FormatJS message descriptor. */
const generateTagProps = (
  j: JSCodeshift,
  element: JSXElement,
  tagName: string,
): Property => {
  const arrowFn = j.arrowFunctionExpression(
    [j.identifier('chunks')],
    j.jsxElement(element.openingElement, element.closingElement, [
      j.jsxExpressionContainer(j.identifier('chunks')),
    ]),
    false,
  );

  return j.property('init', j.literal(tagName), arrowFn);
};

/** Returns the text content of a JSX element with placeholders for parameters. */
const getTextWithPlaceholders = (
  j: JSCodeshift,
  children: (
    | JSXText
    | StringLiteral
    | JSXExpressionContainer
    | JSXElement
    | LiteralKind
    | JSXFragment
  )[],
): [string, Property[], boolean] => {
  let hasI18nUsage = false;
  const text: string[] = [];
  const properties: Property[] = [];
  children.forEach((child, idx) => {
    if (j.JSXText.check(child) || j.StringLiteral.check(child)) {
      if (!isWhitespace(child.value)) {
        hasI18nUsage = true;
      }

      text.push(child.value);
    } else if (
      j.JSXExpressionContainer.check(child) &&
      !j.JSXEmptyExpression.check(child.expression)
    ) {
      const argName = generateArgName(child.expression, idx);
      const placeholderProps = generateArgProps(
        j,
        child.expression as JSXExpressionContainer,
        argName,
      );
      text.push(`{${argName}}`);
      properties.push(placeholderProps);
    } else if (j.JSXElement.check(child)) {
      const tagName = generateTagName(child, idx);
      const tagProps = generateTagProps(j, child, tagName);
      // @ts-expect-error: TypeScript thinks `children` is undefined, but that's wrong
      const [childText, moreProps] = getTextWithPlaceholders(j, child.children);
      text.push(`<${tagName}>${childText}</${tagName}>`);
      properties.push(tagProps);
      properties.push(...moreProps);
    }
  });
  return [
    collapseInternalSpace(text.join('')).trim(),
    properties,
    hasI18nUsage,
  ];
};

/**
 * Generates a call to `intl.formatMessage` with the given text and parameters.
 */
function generateIntlCall(
  j: JSCodeshift,
  text: string,
  params: Property[] = [],
) {
  const intlCallParams = [];
  intlCallParams.push(
    j.objectExpression([
      j.property('init', j.identifier('defaultMessage'), j.literal(text)),
    ]),
  );
  if (params?.length) {
    intlCallParams.push(j.objectExpression(params));
  }
  return j.callExpression(
    j.memberExpression(
      j.identifier('intl'),
      j.identifier('formatMessage'),
      false,
    ),

    intlCallParams,
  );
}

/** Creates a `const intl = useIntl()` statement. */
function createUseIntlCall(j: JSCodeshift) {
  return j.variableDeclaration('const', [
    j.variableDeclarator(
      j.identifier('intl'),
      j.callExpression(j.identifier('useIntl'), []),
    ),
  ]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addUseHookToFunctionBody(j: JSCodeshift, functions: Collection<any>) {
  let hookFound = false;
  functions.forEach((n) => {
    hookFound = true;
    const { body } = n.node;
    // eslint-disable-next-line no-param-reassign
    n.node.body = j.BlockStatement.check(body)
      ? j.blockStatement([createUseIntlCall(j), ...body.body])
      : j.blockStatement([createUseIntlCall(j), j.returnStatement(body)]);
  });
  return hookFound;
}

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
 *
 * @param file The file to transform
 * @param api jscodeshift API
 * @param options Options passed to the transform
 * @returns
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
