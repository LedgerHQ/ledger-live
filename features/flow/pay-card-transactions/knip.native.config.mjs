import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-card-transactions",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/CardTransactionHistory/components/types.ts"],
});
