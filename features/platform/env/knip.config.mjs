import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/env",
  platform: "web",
  entry: ["src/index.ts"],
  additionalProjectExcludes: [],
});
