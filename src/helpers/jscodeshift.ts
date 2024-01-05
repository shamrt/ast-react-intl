import { LiteralKind } from 'ast-types/gen/kinds';
import { NodePath } from 'ast-types/lib/node-path';
import {
  ASTPath,
  Collection,
  Function,
  JSCodeshift,
  JSXAttribute,
  JSXExpressionContainer,
} from 'jscodeshift';

export const isWhitespace = (str: string) => str.trim().length === 0;

export const collapseInternalSpace = (str: string) => str.replace(/\s+/g, ' ');
export const hasObjectExpression = (container: JSXExpressionContainer) =>
  container?.expression?.type === 'ObjectExpression';
export const canHandlePropName = (name: string) => {
  const localizationPropNames = [/defaultMessage/, /description/, /values/];
  const infraPropNames = [/style/, /href/, /type/, /test/i, /textContentType/];
  const ignorePropNames = [...localizationPropNames, ...infraPropNames];
  if (ignorePropNames.some((r) => r.test(name))) {
    return false;
  }

  return true;
};

export const canHandleAttribute = (attr: ASTPath<JSXAttribute>) => {
  // @ts-expect-error: Property 'name' does not exist on type 'Literal'.
  if (attr.value !== null && !canHandlePropName(attr.value?.name.name)) {
    return false;
  }

  // TODO: is the following statement still true?
  // Support for JSX expressions isn't in yet
  if (attr?.value?.value?.type === 'JSXExpressionContainer') {
    return false;
  }

  return true;
};

const looksLikeTextString = (str: string) => {
  if (!str || !str.trim) {
    return false;
  }
  const trimmed = str.trim();
  // Stuff that contains spaces is usually something that needs to be translated
  if (/ /.test(trimmed)) {
    return true;
  }

  // If it's all lower case it probably shouldn't be translated
  if (/^[a-z]+$/.test(trimmed)) {
    return false;
  }

  // If it's camel case (has a lower case letter followed by an upper case letter), same
  if (/[a-z][A-Z]/.test(trimmed)) {
    return false;
  }
  return false;
};

const USUALLY_TEXT_PROP_NAMES = [
  /title/,
  /label/,
  /alt/,
  /description/,
  /placeholder/,
  /text/,
  /message/,
  /cta/i,
  /msg/i,
];

const looksLikeTextPropName = (name: string) => {
  if (!name || !name.trim) {
    return false;
  }

  const trimmed = name.trim();
  const hasTextPropName = USUALLY_TEXT_PROP_NAMES.some((regex) =>
    regex.test(trimmed),
  );

  return hasTextPropName;
};

export const looksLikeText = (propName: string, propValue: string) =>
  looksLikeTextPropName(propName) && looksLikeTextString(propValue);

export const attributeLooksLikeText = (attr: ASTPath<JSXAttribute>) => {
  if (!attr?.value?.name.name || !attr.value.value) {
    return false;
  }
  return looksLikeText(
    attr.value.name.name as string,
    (attr.value.value as LiteralKind).value as string,
  );
};

export function findFunctionByIdentifier(
  j: JSCodeshift,
  identifier: string,
  root: Collection<unknown>,
) {
  return (
    root
      .find(j.Function)
      // eslint-disable-next-line @typescript-eslint/ban-types
      .filter((p: NodePath<Function>) => {
        if (j.FunctionDeclaration.check(p.node)) {
          return p.node.id?.name === identifier;
        }
        return p.parent.value.id && p.parent.value.id.name === identifier;
      })
  );
}
