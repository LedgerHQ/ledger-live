import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-delete-contact",
  platform: "web",
  entry: ["src/index.ts"],
});
