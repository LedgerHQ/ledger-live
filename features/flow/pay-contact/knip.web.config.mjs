import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-contact",
  platform: "web",
  entry: ["src/index.ts"],
  additionalIgnoreDependencies: ["@shared/ui-queued-bottom-sheet"],
});
