import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "shared/analytics-react",
  platform: "native",
  entry: [],
  additionalIgnoreDependencies: ["lodash"],
});
