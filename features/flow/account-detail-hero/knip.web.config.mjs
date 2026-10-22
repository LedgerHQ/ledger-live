import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/account-detail-hero",
  platform: "web",
  entry: ["src/index.ts"],
});
