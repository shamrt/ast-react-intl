module.exports = {
  extends: ['airbnb', 'prettier'],
  plugins: ['@typescript-eslint'],

  parser: '@typescript-eslint/parser',
  root: true,

  rules: {
    'no-use-before-define': 'warn',
    'no-continue': 'warn',

    'import/extensions': 'off',
    'import/no-import-module-exports': 'off',
  },

  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: [
        'plugin:import/typescript',
        'plugin:@typescript-eslint/recommended',
        'prettier',
      ],
    },

    {
      files: ['src/__testfixtures__/*.{ts,tsx}'],
      rules: {
        'import/extensions': 'warn',
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true },
        ],
        'import/no-unresolved': 'off',

        'react/destructuring-assignment': 'off',
        'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/prefer-stateless-function': 'warn',

        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
};
