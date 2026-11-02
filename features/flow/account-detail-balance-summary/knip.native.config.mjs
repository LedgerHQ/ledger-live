import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/account-detail-balance-summary",
  platform: "native",
  entry: ["src/index.ts"],
});
