import { ASTNode } from 'ast-types';
import { LiteralKind } from 'ast-types/gen/kinds';
import {
  Identifier,
  JSCodeshift,
  JSXElement,
  JSXExpressionContainer,
  JSXFragment,
  JSXIdentifier,
  JSXText,
  MemberExpression,
  Property,
  StringLiteral,
} from 'jscodeshift';
import { Collection } from 'jscodeshift/src/Collection';
import { collapseInternalSpace, isWhitespace } from './jscodeshift';

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
export const addI18nImport = (
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

/** Returns the text content of a JSX element with placeholders for FormatJS parameters. */
export const getTextWithPlaceholders = (
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
export function generateIntlCall(
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

/**
 * Generate a `FormattedMessage` component with the given text and parameters.
 */
export function generateFormattedMessageComponent(
  j: JSCodeshift,
  text: string,
  params: Property[] = [],
) {
  const props = [
    j.jsxAttribute(j.jsxIdentifier('defaultMessage'), j.stringLiteral(text)),
  ];
  if (params?.length) {
    props.push(
      j.jsxAttribute(
        j.jsxIdentifier('values'),
        j.jsxExpressionContainer(j.objectExpression(params)),
      ),
    );
  }
  return j.jsxElement(
    j.jsxOpeningElement(j.jsxIdentifier('FormattedMessage'), props, true),
    null,
    [],
  );
}

/** Creates a `const intl = useIntl()` statement. */
export function createUseIntlCall(j: JSCodeshift) {
  return j.variableDeclaration('const', [
    j.variableDeclarator(
      j.identifier('intl'),
      j.callExpression(j.identifier('useIntl'), []),
    ),
  ]);
}

/** Adds `useIntl` hook statement to the top of a function body. */
export function addUseHookToFunctionBody(
  j: JSCodeshift,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functions: Collection<any>,
) {
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
