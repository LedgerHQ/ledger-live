import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/analytics-consent",
  platform: "web",
  entry: ["src/index.ts", "src/debug/index.ts"],
  additionalProjectExcludes: [],
});
