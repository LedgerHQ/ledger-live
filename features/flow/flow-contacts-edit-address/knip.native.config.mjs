import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-edit-address",
  platform: "native",
  entry: ["src/index.ts"],
});
