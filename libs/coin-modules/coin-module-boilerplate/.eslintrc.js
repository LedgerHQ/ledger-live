module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  plugins: ["import"],
  extends: ["plugin:import/typescript"],
  parserOptions: {
    parser: "@typescript-eslint/parser",
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  rules: {
    "no-console": ["error", { allow: ["warn", "error"] }],
    "@typescript-eslint/no-empty-function": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-empty-function": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "import/order": ["error"],
    "import/no-cycle": ["error"]
  },
  overrides: [
    {
      files: ["src/**/*.test.{ts,tsx}", "src/{test,__tests__}/**/*.{ts,tsx}"],
      env: {
        "jest/globals": true,
      },
      plugins: ["jest"],
    },
    {
      // relax rules in tests
      files: ["src/**/*.test.{ts,tsx}", "src/{test,__tests__}/**/*.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-empty-function": "off",
      },
    },
  ],
};
