import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/receive",
  platform: "native",
  entry: [],
  // Until the mobile QR card (LIVE-41215) renders them, only the web components use these contracts.
  additionalProjectExcludes: [
    "src/screens/ReceiveAddress/components/AddressOptionList.types.ts",
    "src/screens/ReceiveAddress/components/AddressSummary.types.ts",
  ],
  // The web card draws a static QR; the mobile one uses @shared/ui-animated-qr-code.
  additionalIgnoreDependencies: ["@shared/ui-qr-code"],
});
