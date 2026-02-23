module.exports = {
  extends: ["@commitlint/config-conventional"],
  parserPreset: {
    parserOpts: {
      // Allow an optional gitmoji shortcode prefix (e.g. ":sparkles: feat(scope): msg")
      headerPattern: /^(?::[\w+-]+:\s)?(\w*)(?:\((.*)\))?!?: (.*)$/,
      headerCorrespondence: ["type", "scope", "subject"],
    },
  },
  rules: {
    "subject-case": [2, "always", ["lower-case"]],
  },
};
