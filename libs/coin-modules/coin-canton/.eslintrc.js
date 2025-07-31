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
  ],
  rules: {
    "no-console": ["error", { allow: ["warn", "error"] }],
    "@typescript-eslint/no-empty-function": "off",
    "no-empty-pattern": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
  },
};
