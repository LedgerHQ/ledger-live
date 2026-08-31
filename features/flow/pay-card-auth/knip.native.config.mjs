import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-card-auth",
  platform: "native",
  entry: ["src/index.native.ts", "src/state/store.ts"],
  additionalProjectExcludes: ["src/index.ts"],
});
