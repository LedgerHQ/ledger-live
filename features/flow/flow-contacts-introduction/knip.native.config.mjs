import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-introduction",
  platform: "native",
  entry: ["src/index.ts", "src/native/index.native.ts"],
  additionalIgnoreDependencies: ["class-variance-authority"],
});
