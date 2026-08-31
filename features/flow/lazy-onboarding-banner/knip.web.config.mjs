import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/lazy-onboarding-banner",
  platform: "web",
  entry: ["src/index.ts", "src/testing.ts"],
  additionalProjectExcludes: ["src/index.native.ts"],
});
