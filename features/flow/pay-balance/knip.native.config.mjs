import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-balance",
  platform: "native",
  entry: ["src/index.native.ts", "src/state/index.ts"],
  additionalProjectExcludes: ["src/index.ts"],
});
