import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/portfolio-services-entry-points",
  platform: "web",
  entry: ["src/index.ts"],
});
