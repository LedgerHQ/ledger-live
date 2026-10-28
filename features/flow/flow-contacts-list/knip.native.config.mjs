import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-list",
  platform: "native",
  entry: ["src/index.ts", "src/native/index.native.ts"],
  additionalIgnoreDependencies: ["@ledgerhq/lumen-design-core", "class-variance-authority"],
});
