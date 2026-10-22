import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/account-detail-settings",
  platform: "native",
  entry: ["src/index.native.ts"],
  additionalIgnoreDependencies: ["@domain/entity-account-name"],
});
