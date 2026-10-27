import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/app-lock",
  platform: "web",
  entry: [],
  additionalIgnoreDependencies: ["buffer", "react-native-fast-crypto"],
});
