import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-request",
  platform: "native",
  entry: [],
  additionalIgnoreDependencies: ["@features/platform-style"],
});
