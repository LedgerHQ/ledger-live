import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/device-intent",
  platform: "web",
  entry: ["src/index.ts", "src/DeviceIntentExecutor.tsx"],
  additionalProjectExcludes: [],
});
