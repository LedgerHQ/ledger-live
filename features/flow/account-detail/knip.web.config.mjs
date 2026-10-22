import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/account-detail",
  platform: "web",
  entry: ["src/index.ts"],
  additionalIgnoreDependencies: [
    "@features/flow-account-detail-hero",
    "@features/flow-account-detail-settings",
  ],
});
