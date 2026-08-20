import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const rootConfig = require("../../../knip.json");

export default {
  ...rootConfig,
  workspaces: {
    ...rootConfig.workspaces,
    "features/platform/contacts": {
      entry: ["src/index.ts", "src/web.ts", "src/device/intents/index.ts"],
      project: ["src/**/*", "!src/**/*.native.*", "!src/index.native.ts"],
    },
  },
};
