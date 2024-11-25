// @ts-check
import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier/recommended';

export default tsEslint.config(
  { ignores: ['node_modules', '.aws-sam', '.prettierrc.js'] },
  eslint.configs.recommended,
  tsEslint.configs.strict,
  tsEslint.configs.stylistic,
  prettierConfig,
  prettierPlugin,
);
