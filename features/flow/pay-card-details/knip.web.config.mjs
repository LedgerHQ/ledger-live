import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-card-details",
  platform: "web",
  entry: ["src/index.ts"],
});
