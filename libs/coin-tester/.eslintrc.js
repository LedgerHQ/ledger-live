module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  ignorePatterns: ["lib", "lib-es", ".turbo"],
  rules: {
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-explicit-any": "warn",
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
      // allow, as warning, only in tests
      files: ["*/__tests__/**/*.{ts,tsx}"],
      rules: {
        "no-console": "off",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/explicit-function-return-type": "off",
      },
    },
  ],
};
