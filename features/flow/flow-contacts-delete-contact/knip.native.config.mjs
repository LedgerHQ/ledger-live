import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-delete-contact",
  platform: "native",
  entry: ["src/index.native.ts"],
  additionalProjectExcludes: ["src/index.ts"],
});
