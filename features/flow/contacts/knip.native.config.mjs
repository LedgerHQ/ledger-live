import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/contacts",
  platform: "native",
  entry: ["src/index.ts"],
});
