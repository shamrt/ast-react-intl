import { ASTNode } from 'ast-types';
import { LiteralKind } from 'ast-types/gen/kinds';
import {
  API,
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
import {
  collapseInternalSpace,
  isWhitespace,
  canHandleAttribute,
  attributeLooksLikeText,
  hasObjectExpression,
  canHandlePropName,
  looksLikeText,
} from './helpers';

type ImportStatementOptions = {
  component?: boolean;
  hook?: boolean;
  inject?: boolean;
};

const getImportStatement = ({
  component = false,
  hook = false,
  inject = false,
}: ImportStatementOptions = {}) => {
  const namedImports = [];
  if (component) {
    namedImports.push('FormattedMessage');
  }
  if (hook) {
    namedImports.push('useIntl');
  }
  if (inject) {
    namedImports.push('injectIntl');
  }
  if (namedImports.length > 0) {
    return `import { ${namedImports.join(', ')} } from 'react-intl';`;
  }
  return '';
};

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

const generateArgName = (expression: ASTNode, idx: number): string => {
  if (expression.type === 'Identifier') {
    return (expression as Identifier).name;
  }
  if (expression.type === 'MemberExpression') {
    return generateArgName((expression as MemberExpression).property, idx);
  }
  return `arg${idx}`;
};

const generateTagName = (element: JSXElement, idx: number): string => {
  if ((element?.openingElement?.name as JSXIdentifier).name) {
    return (element.openingElement.name as JSXIdentifier).name + idx;
  }

  return `tag${idx}`;
};

const generateArgProps = (
  j: JSCodeshift,
  expression: JSXExpressionContainer,
  argName: string,
): Property => j.property('init', j.literal(argName), expression);

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
): [string, Property[]] => {
  const text: string[] = [];
  const properties: Property[] = [];
  children.forEach((child, idx) => {
    if (child.type === 'JSXText' || child.type === 'StringLiteral') {
      text.push(child.value);
    } else if (child.type === 'JSXExpressionContainer') {
      const argName = generateArgName(child.expression, idx);
      const placeholderProps = generateArgProps(
        j,
        child.expression as JSXExpressionContainer,
        argName,
      );
      text.push(`{${argName}}`);
      properties.push(placeholderProps);
    } else if (child.type === 'JSXElement') {
      const tagName = generateTagName(child, idx);
      const tagProps = generateTagProps(j, child, tagName);
      // @ts-expect-error: TypeScript thinks `children` is undefined, but that's wrong
      const [childText, moreProps] = getTextWithPlaceholders(j, child.children);
      text.push(`<${tagName}>${childText}</${tagName}>`);
      properties.push(tagProps);
      properties.push(...moreProps);
    }
  });
  return [collapseInternalSpace(text.join('')).trim(), properties];
};

function generateIntlCall(j: JSCodeshift, text: string, values: Property[]) {
  const intlCallParams = [];
  intlCallParams.push(
    j.objectExpression([
      j.property('init', j.identifier('defaultMessage'), j.literal(text)),
      j.property(
        'init',
        j.identifier('description'),
        j.literal('DESCRIBE_ABOVE_TEXT_HERE'),
      ),
    ]),
  );
  if (values && values.length) {
    intlCallParams.push(j.objectExpression(values));
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

// <span>test</span>
function translateJsxContent(j: JSCodeshift, root: Collection<unknown>) {
  let usedTranslation = false;
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

function translateJsxAttributes(j: JSCodeshift, root: Collection<unknown>) {
  let usedTranslation = false;
  root
    .find(j.JSXAttribute)
    .filter((path) => canHandleAttribute(path) && attributeLooksLikeText(path))
    .forEach((path) => {
      // @ts-expect-error: TypeScript thinks `value` is undefined, but that's wrong
      const [text, params] = getTextWithPlaceholders(j, [path.value.value]);
      if (isWhitespace(text || '')) {
        return;
      }

      usedTranslation = true;
      const callExpression = j.jsxExpressionContainer(
        generateIntlCall(j, text, params),
      );

      if (path?.value?.value) {
        // eslint-disable-next-line no-param-reassign
        path.value.value = callExpression;
      }
    });

  return usedTranslation;
}

function translatePropObjects(j: JSCodeshift, root: Collection<unknown>) {
  let usedTranslation = false;
  root
    .find(j.JSXAttribute)
    .filter((path) =>
      hasObjectExpression(path.value as unknown as JSXExpressionContainer),
    )
    .forEach((path) => {
      const props = // @ts-expect-error: TypeScript being overly strict
        (path.value.value as JSXExpressionContainer)?.expression.properties;
      for (let i = 0; i < props.length; i += 1) {
        if (!canHandlePropName(props[i].key.name)) {
          continue;
        }

        if (!looksLikeText(props[i].key.name, props[i].value.value)) {
          continue;
        }

        const [text, params] = getTextWithPlaceholders(j, [props[i].value]);
        if ((text || '').trim().length === 0) {
          continue;
        }
        usedTranslation = true;
        const callExpression = generateIntlCall(j, text, params);
        props[i].value = callExpression;
      }
    });

  return usedTranslation;
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

  let hasIntlHookUsage = false;

  hasIntlHookUsage = translateJsxAttributes(j, root) || hasIntlHookUsage;
  hasIntlHookUsage = translateJsxContent(j, root) || hasIntlHookUsage;
  hasIntlHookUsage = translatePropObjects(j, root) || hasIntlHookUsage;

  if (hasIntlHookUsage) {
    addI18nImport(j, root, { hook: hasIntlHookUsage });
    return root.toSource(printOptions);
  }

  return undefined;
}

module.exports = transform;
module.exports.parser = 'tsx';
