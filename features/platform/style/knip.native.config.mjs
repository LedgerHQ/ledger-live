import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/style",
  platform: "native",
  entry: [],
  additionalIgnoreDependencies: ["@ledgerhq/lumen-ui-react"],
});
