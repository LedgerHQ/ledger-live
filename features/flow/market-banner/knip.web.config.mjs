import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/market-banner",
  platform: "web",
  entry: ["src/index.ts"],
  additionalProjectExcludes: ["src/index.native.ts"],
});
