import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/contacts",
  platform: "native",
  entry: [
    "src/index.native.ts",
    "src/device/intents/index.ts",
  ],
  additionalProjectExcludes: ["src/index.ts", "src/web.ts"],
});
