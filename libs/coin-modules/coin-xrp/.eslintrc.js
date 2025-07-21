module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: ["plugin:import/typescript"],
  plugins: ["import"],
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
    "@typescript-eslint/no-explicit-any": "warn",
    "import/no-cycle": ["error"],
  },
};
