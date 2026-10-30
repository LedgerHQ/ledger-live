import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-add-address",
  platform: "web",
  entry: ["src/index.ts"],
  additionalIgnoreDependencies: ["@shared/linking"],
});
