// `entry: []` on purpose: knip derives the entry from `package.json`. The web barrel carries no
// `.web` suffix, so the platform glob doesn't exclude it and it has to be named.
import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/shell",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
