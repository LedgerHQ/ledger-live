import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/market-banner",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
