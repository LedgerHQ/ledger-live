import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-detail",
  platform: "web",
  entry: ["src/index.ts"],
  additionalIgnoreDependencies: ["@shared/ui-qr-code"],
});
