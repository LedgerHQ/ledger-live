import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-add-contact",
  platform: "native",
  entry: ["src/index.ts", "src/native/index.native.ts"],
});
