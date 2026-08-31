import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/feature-flags",
  platform: "web",
  entry: ["src/index.ts"],
  additionalProjectExcludes: [],
});
