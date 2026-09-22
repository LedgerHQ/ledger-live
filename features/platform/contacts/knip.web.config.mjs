import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/contacts",
  platform: "web",
  entry: ["src/index.ts", "src/web.ts", "src/device/intents/index.ts"],
  additionalProjectExcludes: ["src/index.native.ts"],
});
