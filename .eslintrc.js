// eslint-disable-next-line @typescript-eslint/no-var-requires
const { defineConfig } = require("eslint-define-config");

module.exports = defineConfig({
  root: true,
  env: {
    node: true,
    es2023: true,
    browser: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:astro/recommended",
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  overrides: [
    {
      files: ["*.astro"],
      parser: "astro-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
      },
      rules: {},
    },
  ],
});
