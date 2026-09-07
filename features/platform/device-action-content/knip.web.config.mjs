import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/device-action-content",
  platform: "web",
  entry: ["src/index.ts"],
});
