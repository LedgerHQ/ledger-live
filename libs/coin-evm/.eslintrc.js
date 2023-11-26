module.exports = {
  env: {
    browser: true,
    es6: true,
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
        "@typescript-eslint/no-explicit-any": "warn",
      },
    },
  ],
  rules: {
    "no-console": ["error", { allow: ["warn", "error"] }],
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/explicit-function-return-type": "error",
  },
};
