# AST react-intl

The objective of this tool is to make easy to migrate an existing codebase to use i18n with [react-intl](https://formatjs.io/docs/react-intl/) ([FormatJS](https://formatjs.io/)).

It's a cleaned-up extension of [ast-react-intl](https://github.com/rwnoronha/ast-react-intl), which itself is based on [ast-i18n](https://github.com/sibelius/ast-i18n), which does the same thing for i18n.

## How it works

- it gets a list of files from the command line
- it runs a babel plugin transform to find all string inside JSXText
- it generates a stable key for the extracted strings
- it generates i18n files format based on this map
- it modify your existing code to use i18n library of your preference

## Example

Before this transform

```jsx
import React from 'react';

const Simple = () => <span>My simple text</span>;
```

After this transform

```jsx
import React from 'react';
import { FormattedMessage } from 'react-intl';

const Simple = () => (
  <span>
    <FormattedMessage defaultMessage="My simple text" />
  </span>
);
```

## Usage of react-intl codemod

```bash
npm i -g jscodeshift

jscodeshift -t src/intlTransformerCodemod.ts PATH_TO_FILES
```

## How to customize denylist

Use ast.config.js to customize denylist for jsx attribute name and call expression calle

```jsx
module.exports = {
  denylistJsxAttributeName: [
    'type',
    'id',
    'name',
    'children',
    'labelKey',
    'valueKey',
    'labelValue',
    'className',
    'color',
    'key',
    'size',
    'charSet',
    'content'
  ],
  denylistCallExpressionCalle: [
    't',
    '_interopRequireDefault',
    'require',
    'routeTo',
    'format',
    'importScripts',
    'buildPath',
    'createLoadable',
    'import',
    'setFieldValue'
  ]
};
```
