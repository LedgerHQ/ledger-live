import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-add-contact",
  platform: "web",
  entry: ["src/index.ts"],
  additionalProjectExcludes: ["src/**/native.ts"],
});
