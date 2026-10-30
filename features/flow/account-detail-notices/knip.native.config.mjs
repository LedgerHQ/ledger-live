import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/account-detail-notices",
  platform: "native",
  entry: ["src/index.ts"],
});
