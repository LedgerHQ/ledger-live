module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  plugins: ["import"],
  rules: {
    "no-console": ["error", { allow: ["warn", "error"] }],
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/explicit-function-return-type": "error",
    "import/order": ["error"],
  },
  overrides: [
    {
      files: ["src/**/*.test.{ts,tsx}"],
      env: {
        "jest/globals": true,
      },
      plugins: ["jest"],
    },
    {
      // allow, as warning, only any in tests
      files: ["*/__tests__/**/*.{ts,tsx}"],
      rules: {
        "no-console": "off",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/explicit-function-return-type": "off",
      },
    },
  ],
};
