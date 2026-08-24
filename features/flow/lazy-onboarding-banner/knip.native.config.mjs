import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/lazy-onboarding-banner",
  platform: "native",
  entry: ["src/index.native.ts", "src/testing.ts"],
  additionalProjectExcludes: ["src/index.ts"],
});
