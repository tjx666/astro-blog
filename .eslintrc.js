const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
    root: true,
    plugins: ['simple-import-sort'],
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
    rules: {
        'import/order': 'off',

        // import order
        'simple-import-sort/imports': [
            'error',
            {
                groups: [
                    // Side effect imports.
                    ['^\\u0000'],
                    // Node.js builtins prefixed with `node:`.
                    ['^node:'],
                    // framework
                    ['^astro', '^react'],
                    // Packages.
                    // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
                    ['^@?\\w'],
                    // source code
                    ['^@(assets|config|components|content|layouts|pages|styles|utils|)(/.*|$)'],
                    // Absolute imports and other imports such as Vue-style `@/foo`.
                    // Anything not matched in another group.
                    ['^'],
                    // Relative imports.
                    // Anything that starts with a dot.
                    ['^\\.'],
                ],
            },
        ],
        'simple-import-sort/exports': 'error',
    },
});
