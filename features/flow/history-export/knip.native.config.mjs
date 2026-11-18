import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/history-export",
  platform: "native",
  entry: ["src/index.ts"],
  additionalIgnoreDependencies: ["@ledgerhq/crypto-icons", "@shared/analytics-react"],
});
