// @ts-expect-error: jscodeshift test utils are not typed
import { defineTest } from 'jscodeshift/dist/testUtils';

describe('intlTransformerCodemod', () => {
  // defineTest(__dirname, 'intlTransformerCodemod', null, 'Classes');
  // defineTest(__dirname, 'intlTransformerCodemod', null, 'Diacritics');
  // defineTest(__dirname, 'intlTransformerCodemod', null, 'ExpressionContainer');
  defineTest(__dirname, 'intlTransformerCodemod', null, 'Functional');
  // defineTest(__dirname, 'intlTransformerCodemod', null, 'Props');
  // defineTest(__dirname, 'intlTransformerCodemod', null, 'Tsx');
  // defineTest(__dirname, 'intlTransformerCodemod', null, 'Yup');
  defineTest(__dirname, 'intlTransformerCodemod', null, 'CallExpression');
  defineTest(__dirname, 'intlTransformerCodemod', null, 'Imported');
  // defineTest(__dirname, 'intlTransformerCodemod', null, 'WithHoc');
  defineTest(__dirname, 'intlTransformerCodemod', null, 'NoChange');
  defineTest(__dirname, 'intlTransformerCodemod', null, 'Hooks');
  defineTest(__dirname, 'intlTransformerCodemod', null, 'HooksInlineExport');
  // defineTest(__dirname, 'intlTransformerCodemod', null, 'Classnames');
  // defineTest(__dirname, 'intlTransformerCodemod', null, 'Svg');
  // defineTest(__dirname, 'intlTransformerCodemod', null, 'Parameters');
});
