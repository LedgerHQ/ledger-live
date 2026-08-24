import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-balance",
  platform: "web",
  entry: ["src/index.ts", "src/state/index.ts"],
  additionalProjectExcludes: ["src/index.native.ts"],
  additionalIgnoreDependencies: ["@shared/ui-queued-bottom-sheet"],
});
