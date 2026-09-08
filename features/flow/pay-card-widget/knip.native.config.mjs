import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-card-widget",
  platform: "native",
  entry: ["src/index.native.ts"],
  additionalProjectExcludes: ["src/index.ts"],
});
