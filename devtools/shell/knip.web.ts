import { createRequire } from "module";
import type { KnipConfig } from "knip";

const require = createRequire(import.meta.url);
const rootConfig = require("../../knip.json");

const config: KnipConfig = {
  ...rootConfig,
  ignore: [...rootConfig.ignore, "src/**/*.native.*"],
  ignoreWorkspaces: ["apps/ledger-live-mobile"],
  compilers: {
    "web.ts": (source: string) => source,
    "web.tsx": (source: string) => source,
  },
  workspaces: {
    "devtools/shell": {
      entry: ["src/index.ts"],
      project: ["src/**/*", "!src/**/*.native.*"],
    },
  },
};

export default config;
