import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/account-detail-balance-summary",
  platform: "web",
  entry: ["src/index.ts"],
});
