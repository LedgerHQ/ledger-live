module.exports = {
  root: true,
  extends: [
    "@react-native-community",
    "airbnb",
    "plugin:json/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
  ],
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        extensions: [
          ".android.ts",
          ".android.js",
          ".ios.ts",
          ".ios.js",
          ".ts",
          ".tsx",
          ".d.ts",
          ".js",
          ".jsx",
          ".json",
          ".node",
          ".png",
        ],
      },
    },
  },
  plugins: ["detox"],
  rules: {
    "no-console": [
      "error",
      {
        allow: ["warn", "error"],
      },
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "lines-between-class-members": 0,
    "flowtype/space-after-type-colon": 0,
    "no-continue": 0,
    "no-control-regex": 0,
    "no-return-assign": 0,
    "no-shadow": 0,
    "prefer-template": 0,
    "no-unused-expressions": 0,
    "no-plusplus": 0,
    "no-nested-ternary": 0,
    "global-require": 0,
    "no-restricted-globals": 0,
    "no-restricted-syntax": 0,
    "import/extensions": 0,
    "import/no-mutable-exports": 0,
    "import/prefer-default-export": 0,
    "import/namespace": ["error", { allowComputed: true }],
    "no-use-before-define": 0,
    "react/sort-comp": 0,
    "react/jsx-boolean-value": 0,
    "react/prefer-stateless-function": 0,
    "react/jsx-filename-extension": 0,
    "react/no-multi-comp": 0,
    "react/no-unused-state": 0,
    "react/no-array-index-key": 0,
    "no-await-in-loop": 0,
    "class-methods-use-this": 0,
    "react/no-unused-prop-types": 0,
    "react/require-default-props": 0,
    "prefer-destructuring": 0,
    "react/destructuring-assignment": 0,
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react/jsx-no-bind": 0,
    // for importing detox
    "import/no-extraneous-dependencies": [
      "error",
      { devDependencies: ["e2e/**"] },
    ],
    // For Link component from native-ui, that is interpreted like a html link, and thus this rule tried to impose a href prop on it
    "jsx-a11y/anchor-is-valid": [
      "error",
      {
        components: [],
      },
    ],

    // New rules from default RN 0.61 ruleset
    // that were triggered in our codebase

    // The following are probably intentional (from my own guesstimate)
    "max-classes-per-file": 0,
    "react/jsx-curly-brace-presence": 0,
    "react/jsx-props-no-spreading": 0,
    "react/state-in-constructor": 0,
    "react/static-property-placement": 0,
    "react/default-props-match-prop-types": 0,
    "jsx-a11y/anchor-is-valid": 0, // this is not valid in react native as we don't have href
    "@typescript-eslint/no-non-null-assertion": 0,
    "react-native/no-inline-styles": 0,
    "react/prop-types": 0, // causes issues with typescript, reports false positives

    // These ones are good practice we could switch to, so warn only
    "eslint-comments/no-unlimited-disable": "warn",
    "eslint-comments/no-unused-disable": "warn",
    "react/jsx-fragments": "warn",
    "react/no-deprecated": "warn",

    // Enables no-unused-vars only from TypeScript
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: true,
      },
    ],

    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@ledgerhq/live-common/lib/*"],
            message:
              '🚨 Please when importing from live-common, remove the "/lib/" in the path 🚨',
          },
        ],
      },
    ],
  },
  globals: {
    __DEV__: false,
    __REDUX_DEVTOOLS_EXTENSION__: false,
    fetch: false,
    it: false,
    expect: false,
  },
};
