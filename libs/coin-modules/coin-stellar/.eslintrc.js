module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: ["plugin:import/typescript"],
  plugins: ["import"],
  rules: {
    eqeqeq: ["error"],
    "no-console": ["error", { allow: ["warn", "error"] }],
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "import/no-cycle": ["error"],
    "import/order": [
      "error",
      {
        alphabetize: {
          order: "asc",
        },
      },
    ],
  },
  overrides: [
    {
      files: ["src/**/*.test.{ts,tsx}"],
      env: {
        "jest/globals": true,
      },
      plugins: ["jest"],
      rules: {
        "jest/no-restricted-matchers": [
          "error",
          {
            toBeFalsy: null,
            toBeTruthy: null,
            toBeDefined: null,
          },
        ],
      },
    },
  ],
};
