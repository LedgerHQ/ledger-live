import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/pay-contact",
  platform: "native",
  entry: ["src/index.native.ts"],
  additionalProjectExcludes: ["src/index.ts"],
  additionalIgnoreDependencies: ["@ledgerhq/crypto-icons"], // update when mobile uses crypto icons
});
