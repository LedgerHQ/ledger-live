module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  extends: ["plugin:import/typescript"],
  plugins: ["import"],
  rules: {
    "no-console": ["error", { allow: ["warn", "error"] }],
    "linebreak-style": ["error", "unix"],
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
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
  ],
};
