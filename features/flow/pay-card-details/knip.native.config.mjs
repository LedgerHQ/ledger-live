import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

// `entry` is empty on purpose: with the native compilers registered, `src/index.native.ts` is
// already one of knip's default entry patterns, and naming it again is what knip reports as a
// redundant entry pattern.
export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-card-details",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
