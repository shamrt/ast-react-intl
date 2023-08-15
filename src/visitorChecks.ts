import { NodePath } from 'ast-types/lib/node-path';
import {
  CallExpression,
  JSXAttribute,
  JSXElement,
  JSXIdentifier,
  ObjectProperty,
} from 'jscodeshift';
import { getAstConfig } from './config';

const svgElementNames = ['svg', 'path', 'g'];

export const hasStringLiteralJSXAttribute = (path: NodePath<JSXAttribute>) => {
  if (!path.node.value) {
    return false;
  }

  if (path.node.value.type !== 'StringLiteral') {
    return false;
  }

  const { blackListJsxAttributeName } = getAstConfig();

  if (blackListJsxAttributeName.includes(path.node.name.name as string)) {
    return false;
  }

  return true;
};

export const hasStringLiteralArguments = (path: NodePath<CallExpression>) => {
  const { callee } = path.node;

  const { blackListCallExpressionCalle } = getAstConfig();

  if (callee.type === 'Identifier') {
    if (blackListCallExpressionCalle.indexOf(callee.name) > -1) {
      return false;
    }
  }

  if (callee.type === 'Import') {
    return false;
  }

  if (callee.type === 'MemberExpression') {
    const { property } = callee;

    if (
      property &&
      property.type === 'Identifier' &&
      property.name === 'required'
    ) {
      if (path.node.arguments.length === 1) {
        if (path.node.arguments[0].type === 'StringLiteral') {
          return true;
        }
      }

      return true;
    }

    // do not convert react expressions
    return false;
  }

  if (path.node.arguments.length === 0) {
    return false;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const arg of path.node.arguments) {
    // myFunc('ok')
    if (arg.type === 'StringLiteral') {
      return true;
    }

    // showSnackbar({ message: 'ok' });
    if (arg.type === 'ObjectExpression') {
      if (arg.properties.length === 0) {
        continue;
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const prop of arg.properties) {
        if ((prop as ObjectProperty)?.value?.type === 'StringLiteral') {
          return true;
        }
      }
    }

    // myFunc(['ok', 'blah']) - should we handle this case?
  }

  return false;
};

export const isSvgElement = (path: NodePath<JSXElement>) => {
  const jsxIdentifier = path.node.openingElement.name as JSXIdentifier;
  return svgElementNames.includes(jsxIdentifier.name);
};

export const isSvgElementAttribute = (path: NodePath<JSXAttribute>) => {
  if (!path.parent || !path.parent.name) {
    return false;
  }
  return svgElementNames.includes(path.parent.name.name);
};
