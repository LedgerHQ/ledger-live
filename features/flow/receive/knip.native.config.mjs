import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/receive",
  platform: "native",
  entry: [],
  // The web card draws a static QR; the mobile one uses @shared/ui-animated-qr-code.
  additionalIgnoreDependencies: ["@shared/ui-qr-code"],
});
