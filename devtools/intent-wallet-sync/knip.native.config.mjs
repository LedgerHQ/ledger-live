import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/intent-wallet-sync",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
