const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
    root: true,
    extends: ['@yutengjing/eslint-config-typescript', 'plugin:astro/recommended'],
    overrides: [
        {
            files: ['*.astro'],
            parser: 'astro-eslint-parser',
            parserOptions: {
                parser: '@typescript-eslint/parser',
                extraFileExtensions: ['.astro'],
            },
            rules: {},
        },
    ],
});
