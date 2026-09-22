import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/pay-card",
  platform: "native",
  entry: ["src/index.native.ts"],
  additionalProjectExcludes: ["src/index.ts"],
});
