const path = require("path");
const { createFlowJestConfig } = require("@support/jest-features-flow");

const config = createFlowJestConfig();

module.exports = {
  ...config,
  projects: config.projects
    .filter(project => project.displayName === "native")
    .map(project => ({
      ...project,
      moduleFileExtensions: ["native.tsx", "native.ts", "tsx", "ts", "js", "jsx", "json"],
      moduleNameMapper: {
        ...project.moduleNameMapper,
        "^@ledgerhq/lumen-ui-rnative(/.*)?$": path.join(
          __dirname,
          "jest/mocks/passthrough-native.js",
        ),
        "^react-native-safe-area-context$": path.join(__dirname, "jest/mocks/safe-area-context.js"),
      },
    })),
};
