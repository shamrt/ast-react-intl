// @ts-expect-error: jscodeshift test utils are not typed
import { defineTest } from 'jscodeshift/dist/testUtils';

describe('intlTransformerCodemod', () => {
  const FIXTURE_FILENAMES = [
    'Diacritics',
    // 'ExpressionContainer',
    'Functional',
    'Props',
    'Tsx',
    'Yup',
    'CallExpression',
    'Imported',
    // 'WithHoc',
    'NoChange',
    'Hooks',
    'HooksInlineExport',
    'Classnames',
    'Svg',
    'Parameters',
  ];

  FIXTURE_FILENAMES.forEach((filename) => {
    defineTest(__dirname, 'intlTransformerCodemod', null, filename);
  });
});
