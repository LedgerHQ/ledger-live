import { createRequire } from "module";
import type { KnipConfig } from "knip";

const require = createRequire(import.meta.url);
const rootConfig = require("../../knip.json");

const config: KnipConfig = {
  ...rootConfig,
  ignore: [...rootConfig.ignore, "src/**/*.web.*"],
  ignoreWorkspaces: ["apps/ledger-live-mobile"],
  compilers: {
    "native.ts": (source: string) => source,
    "native.tsx": (source: string) => source,
  },
  workspaces: {
    "devtools/transport-panel": {
      entry: ["src/index.native.ts"],
      project: ["src/**/*", "!src/**/*.web.*"],
    },
  },
};

export default config;
