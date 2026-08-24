import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-card-auth",
  platform: "web",
  entry: ["src/index.ts", "src/state/store.ts"],
  additionalProjectExcludes: ["src/index.native.ts"],
});
