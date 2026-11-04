import { createMonorepoRootKnipConfig } from "./base.mjs";

const config = createMonorepoRootKnipConfig();
const jestWorkspace = "./support/jest";

config.workspaces = {
  ...config.workspaces,
  [jestWorkspace]: {
    ...config.workspaces[jestWorkspace],
    entry: [...(config.workspaces[jestWorkspace]?.entry ?? []), "**/*.fixture.mts"],
  },
};

export default config;
