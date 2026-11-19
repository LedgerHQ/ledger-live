import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/receive",
  platform: "web",
  entry: [],
  // Until the desktop QR card (LIVE-41214) renders them, only the native components use these contracts.
  additionalProjectExcludes: [
    "src/screens/ReceiveAddress/components/AddressOptionList.types.ts",
    "src/screens/ReceiveAddress/components/AddressSummary.types.ts",
  ],
  // The mobile card animates its QR; the desktop one uses @shared/ui-qr-code.
  additionalIgnoreDependencies: ["@shared/ui-animated-qr-code"],
});
