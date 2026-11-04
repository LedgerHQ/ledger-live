import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-edit-contact",
  platform: "native",
  entry: ["src/index.ts", "src/native/index.native.ts"],
});
