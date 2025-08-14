module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  ignorePatterns: ["lib", "lib-es"],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
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
