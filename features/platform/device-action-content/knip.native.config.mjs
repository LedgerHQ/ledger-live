import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/device-action-content",
  platform: "native",
  entry: ["src/index.native.ts"],
  // The web barrel carries no `.web` suffix, so the platform glob doesn't exclude it.
  additionalProjectExcludes: ["src/index.ts"],
});
