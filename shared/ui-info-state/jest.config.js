const path = require("path");
const { createFlowJestConfig } = require("@support/jest-features-flow");

const config = createFlowJestConfig();

module.exports = {
  ...config,
  projects: config.projects.map(project => {
    if (project.displayName === "web") {
      return {
        ...project,
        moduleNameMapper: {
          ...project.moduleNameMapper,
          // The generic Lumen web stub doesn't render Banner title/description as text.
          "^@ledgerhq/lumen-ui-react(/.*)?$": path.join(
            __dirname,
            "jest/mocks/lumen-ui-react-web.js",
          ),
        },
      };
    }

    if (project.displayName === "native") {
      return {
        ...project,
        moduleNameMapper: {
          ...project.moduleNameMapper,
          // @shared/ui-queued-bottom-sheet's barrel pulls in QueuedBottomSheet.native.tsx,
          // which imports react-native-safe-area-context — a real native module this stub
          // avoids loading, same as ui-queued-bottom-sheet's own jest config does.
          "^react-native-safe-area-context$": path.join(
            __dirname,
            "jest/mocks/safe-area-context.js",
          ),
          // The generic Lumen native stub renders Banner's description as text but not its
          // title; InfoState always sets both.
          "^@ledgerhq/lumen-ui-rnative(/.*)?$": path.join(
            __dirname,
            "jest/mocks/lumen-ui-rnative.js",
          ),
        },
      };
    }

    return project;
  }),
};
