import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-card",
  platform: "native",
  additionalProjectExcludes: ["src/index.ts"],
  additionalIgnoreDependencies: ["@features/flow-pay-card-assets"],
});
