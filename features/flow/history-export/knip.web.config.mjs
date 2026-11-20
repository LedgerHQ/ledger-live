import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/history-export",
  platform: "web",
  entry: ["src/index.ts", "src/web/index.web.ts"],
  additionalIgnoreDependencies: ["@shared/ui-info-state"],
});
