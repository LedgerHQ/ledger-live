import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-card-request",
  platform: "web",
  entry: ["src/index.ts"],
  additionalProjectExcludes: ["src/index.native.ts"],
  additionalIgnoreDependencies: ["@shared/ui-queued-bottom-sheet"],
});
