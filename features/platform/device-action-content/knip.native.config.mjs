import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/device-action-content",
  platform: "native",
  entry: ["src/index.native.ts"],
  // Web-only: `Animation.web.tsx` is excluded from this pass, so its imports look unused here.
  additionalIgnoreDependencies: ["@shared/env"],
});
