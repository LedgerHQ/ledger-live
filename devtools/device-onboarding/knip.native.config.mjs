import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/device-onboarding",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
