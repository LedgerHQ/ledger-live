module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  rules: {
    "no-console": ["error", { allow: ["warn", "error"] }],
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-explicit-any": "warn",
  },
  overrides: [
    {
      files: ["src/*.{ts,tsx}"],
      env: {
        "jest/globals": true,
      },
      plugins: ["jest"],
      rules: {
        "no-console": "off",
      },
    },
  ],
};
