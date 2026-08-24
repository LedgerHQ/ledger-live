import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/aggregated-assets",
  platform: "web",
  entry: ["src/index.ts"],
  additionalProjectExcludes: [],
});
