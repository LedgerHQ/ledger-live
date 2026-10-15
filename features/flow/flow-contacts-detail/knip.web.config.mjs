import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-detail",
  platform: "web",
  entry: [],
  additionalProjectExcludes: ["src/native.ts"],
  additionalIgnoreDependencies: ["@shared/ui-qr-code"],
});
