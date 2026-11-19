import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/receive",
  platform: "web",
  entry: [],
  // The mobile card animates its QR; the desktop one uses @shared/ui-qr-code.
  additionalIgnoreDependencies: ["@shared/ui-animated-qr-code"],
});
