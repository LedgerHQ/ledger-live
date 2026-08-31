import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/large-screen-upsell",
  platform: "web",
  entry: [
    "src/index.ts",
    "src/utils/getNanoOnlyDeviceModel.ts",
    "src/utils/isLargeScreenUpsellBannerEnabled.ts",
    "src/utils/upsellCta.ts",
    "src/state/schema.mock.ts",
  ],
  additionalProjectExcludes: [],
});
