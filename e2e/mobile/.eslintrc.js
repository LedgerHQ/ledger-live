module.exports = {
  env: {
    jest: true,
  },
  rules: {
    "no-var": "off",
  },
  overrides: [
    {
      files: ["**/*.{js,jsx}"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
};
