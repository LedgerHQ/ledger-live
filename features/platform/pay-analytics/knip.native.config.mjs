import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/pay-analytics",
  platform: "native",
  entry: [],
  additionalIgnoreDependencies: ["@shared/analytics-react"],
});
