module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  ignorePatterns: ["lib", "lib-es", ".turbo"],
  overrides: [
    {
      files: ["src/**/*.test.{ts,tsx}"],
      env: {
        "jest/globals": true,
      },
      plugins: ["jest"],
    },
  ],
  rules: {
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
