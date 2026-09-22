import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-card-details",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
