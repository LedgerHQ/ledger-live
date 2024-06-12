module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "json"],
  extends: [
    "eslint:recommended",
    "plugin:prettier/recommended",
    "plugin:json/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "prettier/prettier": "error",
    "no-inner-declarations": "off",
    // Enables no-unused-vars only from TypeScript
    "no-unused-vars": "off",
    "no-restricted-imports": [
      2,
      {
        paths: [
          "lodash", // you must use the lodash/fp module import style to avoid importing the entire library
        ],
      },
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: true,
      },
    ],
  },
};
