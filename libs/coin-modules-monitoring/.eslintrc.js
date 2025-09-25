module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  plugins: ["import"],
  ignorePatterns: ["lib", "lib-es"],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "import/no-cycle": ["error"],
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
  ],
};
