import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-card-transactions",
  platform: "native",
  entry: ["src/index.native.ts"],
  // The native screen renders nothing, so the list components it would hold are web-only for now.
  additionalProjectExcludes: ["src/index.ts", "src/CardTransactions/components/**"],
});
