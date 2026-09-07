import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

// `entry` is empty on purpose: the package entry point is `src/index.native.ts`, which the
// helper already registers through its `src/**/*.native.{ts,tsx}` platform-entry glob. Naming
// it again is what knip reports as a redundant entry pattern.
export default createDualPlatformKnipConfig({
  packagePath: "shared/ui-info-state",
  platform: "native",
  entry: [],
});
