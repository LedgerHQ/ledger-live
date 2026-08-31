import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/wallet-sync",
  platform: "web",
  entry: ["src/index.ts"],
  additionalProjectExcludes: [],
});
