module.exports = {
  settings: {
    // Align with pnpm-workspace catalog `jest`; package has no jest dep (Playwright-only).
    jest: { version: "30.2.0" },
  },
  env: {
    browser: true,
    es6: true,
    node: true,
    "jest/globals": true,
  },
  plugins: ["jest"],
  extends: [
    "plugin:prettier/recommended",
    "plugin:json/recommended",
    "plugin:jest/recommended",
    "plugin:jest/style",
  ],
  rules: {
    "no-empty-pattern": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-var-requires": "off",
  },
  globals: {
    globalThis: "readonly",
  },
};
