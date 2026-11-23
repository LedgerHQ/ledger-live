// Type-aware lint of the new layers with sensitive/no-sensitive-in-text: see README.md#sensitiveno-sensitive-in-text.
import parser from "@typescript-eslint/parser";
import sensitive from "./src/no-sensitive-in-text.js";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/lib/**",
      "**/lib-es/**",
      "**/dist/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/__tests__/**",
      "**/__mocks__/**",
      "**/__fixtures__/**",
      "**/*.mock.*",
      "**/*.stories.*",
      "**/jest/**",
      "**/*.config.*",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser,
      parserOptions: {
        // Nearest tsconfig.json per file; tsserver follows a dual package's references to its web or native config.
        projectService: true,
        tsconfigRootDir: new URL("../..", import.meta.url).pathname,
      },
    },
    linterOptions: { reportUnusedDisableDirectives: false },
    plugins: { sensitive },
    rules: { "sensitive/no-sensitive-in-text": "error" },
  },
];
