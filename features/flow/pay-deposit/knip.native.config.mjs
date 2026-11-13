import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-deposit",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
