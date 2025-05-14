module.exports = {
  env: {
    jest: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  overrides: [
    {
      files: ["**/*.{ts,js,jsx}"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
};
