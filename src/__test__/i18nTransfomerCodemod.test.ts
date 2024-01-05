// @ts-expect-error: jscodeshift test utils are not typed
import { defineTest } from 'jscodeshift/dist/testUtils';

describe('intlTransformerCodemod', () => {
  const FIXTURE_FILENAMES = [
    'CallExpression',
    'Classnames',
    'Diacritics',
    'ExpressionContainer',
    'Functional',
    'Hooks',
    'HooksInlineExport',
    'Imported',
    'NoChange',
    'Parameters',
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
