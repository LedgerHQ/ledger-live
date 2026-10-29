import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/account-detail-delegations",
  platform: "web",
  entry: ["src/index.ts"],
});
