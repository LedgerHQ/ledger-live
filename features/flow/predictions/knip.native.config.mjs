import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/predictions",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
  additionalIgnoreDependencies: ["@shared/ui-animated-height"],
});
