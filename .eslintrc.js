module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true
  },
  extends: [
    "airbnb",
    "plugin:react/recommended",
    "plugin:flowtype/recommended",
    "prettier"
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  parser: "babel-eslint",
  plugins: ["flowtype", "react"],
  rules: {
    "no-console": ["error", { allow: ["warn", "error"] }],
    "linebreak-style": ["error", "unix"],
    semi: ["error", "always"],
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "flowtype/generic-spacing": 0,
    "flowtype/space-after-type-colon": 0,
    "import/prefer-default-export": 0,
    "no-plusplus": 0,
    "no-underscore-dangle": 0,
    "prefer-template": 0,
    "no-await-in-loop": 0,
    "no-restricted-syntax": 0,
    "consistent-return": 0,
    "no-lonely-if": 0,
    "no-use-before-define": 0,
    "react/jsx-filename-extension": 0,
    "no-nested-ternary": 0,
    "import/no-cycle": 0,
    "no-multi-assign": 0,
    "guard-for-in": 0,
    "no-continue": 0,
    "react/require-default-props": 0,
    "react/default-props-match-prop-types": 0,
    "react/destructuring-assignment": 0,
    "react/no-unused-state": 0,
    "react/sort-comp": 0,
    "lines-between-class-members": 0,
    "prefer-destructuring": 0
  }
};
