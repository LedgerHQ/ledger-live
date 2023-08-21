module.exports = {
  plugins: ["react", "react-hooks"],
  rules: {
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-explicit-any": "warn",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
