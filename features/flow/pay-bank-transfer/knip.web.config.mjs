import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-bank-transfer",
  platform: "web",
  entry: ["src/index.ts"],
  additionalProjectExcludes: ["src/index.native.ts"],
});
