import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-card-transactions",
  platform: "native",
  entry: [],
  additionalProjectExcludes: [
    "src/index.ts",
    "src/exports.ts",
    "src/CardTransactionHistory/components/types.ts",
    "src/CardTransactionHistory/components/useHistoryRowViewModel.ts",
  ],
});
