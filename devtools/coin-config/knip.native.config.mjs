import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/coin-config",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
