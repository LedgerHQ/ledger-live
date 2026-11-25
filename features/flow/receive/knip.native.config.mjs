import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/receive",
  platform: "native",
  entry: [],
  // Until the mobile banners (LIVE-41219) render them, only the web banners use this contract.
  additionalProjectExcludes: [
    "src/screens/ReceiveAddress/components/ReceiveAddressNotices.types.ts",
  ],
});
