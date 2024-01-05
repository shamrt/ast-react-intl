import cosmiconfig from 'cosmiconfig';

const explorer = cosmiconfig('ast');

type ASTConfig = {
  denylistJsxAttributeName: string[];
  denylistCallExpressionCalle: string[];
};

const defaultConfig: ASTConfig = {
  denylistJsxAttributeName: [
    'type',
    'id',
    'name',
    'children',
    'labelKey',
    'valueKey',
    'labelValue',
    'className',
  ],
  denylistCallExpressionCalle: [
    't',
    '_interopRequireDefault',
    'require',
    'routeTo',
    'format',
    'importScripts',
  ],
};

let config: ASTConfig | null = null;

export const getAstConfig = (): ASTConfig => {
  if (config) {
    return config;
  }

  const result = explorer.searchSync();

  if (result) {
    config = {
      ...defaultConfig,
      ...result.config,
    };

    return config;
  }

  config = defaultConfig;

  return config;
};

export default getAstConfig;
