// @ts-expect-error: jscodeshift test utils are not typed
import { defineTest } from 'jscodeshift/dist/testUtils';

describe('intlTransformerCodemod', () => {
  const FIXTURE_FILENAMES = [
    'CallExpression',
    'Classnames',
    'Diacritics',
    'ExpressionContainer',
    'Functional',
    'FunctionArguments',
    'Hooks',
    'HooksInlineExport',
    'Imported',
    'MessageDescriptors',
    'NoChange',
    'Parameters',
    'PreExistingComponentI18n',
    'PreExistingHookI18n',
    'Props',
    'Svg',
    'Tsx',
    'WithHoc',
    'Yup',
  ];

  FIXTURE_FILENAMES.forEach((filename) => {
    defineTest(__dirname, 'intlTransformerCodemod', null, filename);
  });
});
