import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/app-lock",
  platform: "native",
  entry: [],
  additionalIgnoreDependencies: ["buffer"],
});
