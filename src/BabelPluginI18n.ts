import { PluginObj } from '@babel/core';
import { ASTNode } from 'jscodeshift';
import {
  hasStringLiteralArguments,
  hasStringLiteralJSXAttribute,
  isSvgElementAttribute
} from "./visitorChecks";
import { getStableKey, getStableValue } from './stableString';

let keyMaxLength = 40;
let phrases: string[] = [];
let i18nMap: Record<string, string> = {};

const addPhrase = (displayText: string, keyText?: string) => {
  const key = getStableKey(keyText || displayText, keyMaxLength);
  const value = getStableValue(displayText);

  if (!key || !value) {
    return null;
  }

  i18nMap[key] = value;
  phrases = [
    ...phrases,
    value,
  ];

  return { key, value };
};

function extractArguments(jsxContentNodes: ASTNode[]) {
  let textWithArgs = '';
  let textWithoutArgs = '';
  let argIndex = 0;
  let hasText = false;
  const texts = [];
  for(let i = 0; i < jsxContentNodes.length; i+=1) {
    const element = jsxContentNodes[i];
    if (element.type === 'JSXText') {
      hasText = true;
      textWithArgs += element.value;
      textWithoutArgs += element.value;
    } else if (element.type === 'JSXExpressionContainer') {
      textWithArgs += `{arg${argIndex}}`;
      argIndex+=1;
    } else if (hasText) {
        texts.push({ textWithArgs, textWithoutArgs });
        textWithArgs = '';
        textWithoutArgs = ''
      }
  }
  if (hasText) {
    texts.push({ textWithArgs, textWithoutArgs });
  }
  return texts;
}

function BabelPluginI18n(): PluginObj {
  return {
    name: 'i18n',
    visitor: {
      JSXAttribute(path) {
        const { node } = path;

        if (hasStringLiteralJSXAttribute(path) && !isSvgElementAttribute(path)) {
          addPhrase(node.value.value);
        }
      },
      JSXElement(path) {
        const { node } = path;
        const jsxContentNodes =  node.children;
        extractArguments(jsxContentNodes)
          .forEach(({textWithArgs, textWithoutArgs}) =>
            addPhrase(textWithArgs, textWithoutArgs));

      },
      JSXExpressionContainer(path) {
        const { node } = path;

        if (node.expression.type === 'StringLiteral') {
          addPhrase(path.node.expression.value);
        } else if (node.expression.type === 'ConditionalExpression') {
          const {expression} = path.node;
          if (expression.consequent.type === 'StringLiteral') {
            addPhrase(expression.consequent.value)
          }
          if (expression.alternate.type === 'StringLiteral') {
            addPhrase(expression.alternate.value);
          }
        }
      },
      CallExpression(path) {
        if (hasStringLiteralArguments(path)) {
          // eslint-disable-next-line no-restricted-syntax
          for (const arg of path.node.arguments) {
            if (arg.type === 'StringLiteral') {
              addPhrase(arg.value)
            }

            if (arg.type === 'ObjectExpression') {
              if (arg.properties.length === 0) {
                continue;
              }

              // eslint-disable-next-line no-restricted-syntax
              for (const prop of arg.properties) {
                if (prop.value && prop.value.type === 'StringLiteral') {
                  addPhrase(prop.value.value);
                }
              }
            }
          }
        }
      }
    }
  }
}


BabelPluginI18n.clear = () => {
  phrases = [];
  i18nMap = {};
};
BabelPluginI18n.setMaxKeyLength = (maxLength: number) => {
  keyMaxLength = maxLength;
};
BabelPluginI18n.getExtractedStrings = () => phrases;
BabelPluginI18n.getI18Map = () => i18nMap;

export default BabelPluginI18n;
