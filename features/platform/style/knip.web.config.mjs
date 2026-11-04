import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/style",
  platform: "web",
  entry: [],
  additionalIgnoreDependencies: ["@ledgerhq/lumen-ui-rnative"],
});
