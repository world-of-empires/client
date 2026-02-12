// eslint.config.mjs
import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  // 1) Ignores — separate block (flat style)
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      // 'src/packages/api/graphql/__generated__/**',
      // 'src/packages/api/graphql/_generated_/**'
    ]
  },

  // 2) Main config via compat
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
    rules: {
      'import/no-default-export': 'off',
      'import/no-anonymous-default-export': 'off',
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off'
    }
  })
];
