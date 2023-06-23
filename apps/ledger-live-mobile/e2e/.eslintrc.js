module.exports = {
  env: {
    jest: true,
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
