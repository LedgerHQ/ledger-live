import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/contacts",
  platform: "native",
  entry: ["src/index.ts", "src/device/intents/index.ts"],
});
