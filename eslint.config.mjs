import yutengjingEslintConfigTypescript from '@yutengjing/eslint-config-typescript';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintPluginAstro from 'eslint-plugin-astro';

export default defineConfig([
    globalIgnores(['public/**', 'dist/**', '**/*.md']),
    yutengjingEslintConfigTypescript,
    ...eslintPluginAstro.configs.recommended,
    {
        rules: {
            'n/prefer-global/process': 'off',
            '@eslint-community/eslint-comments/disable-enable-pair': 'off',
            'import-x/no-unresolved': [
                'error',
                {
                    ignore: ['astro:.*'],
                },
            ],
        },
    },
    {
        files: ['**/*.cjs'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
]);
