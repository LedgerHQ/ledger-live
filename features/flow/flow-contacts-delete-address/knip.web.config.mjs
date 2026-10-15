import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-delete-address",
  platform: "web",
  entry: ["src/index.ts"],
});
