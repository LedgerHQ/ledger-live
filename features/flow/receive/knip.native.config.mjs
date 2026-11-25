import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/receive",
  platform: "native",
  entry: [],
  // Until the mobile help (LIVE-41224) renders them, only the web views use these contracts.
  additionalProjectExcludes: [
    "src/screens/ReceiveAddress/components/HelpPanel.types.ts",
    "src/screens/ReceiveAddress/components/ReceiveAddressExtras.types.ts",
  ],
});
