import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-edit-contact",
  platform: "web",
  entry: ["src/index.web.ts"],
  additionalProjectExcludes: ["src/index.native.ts", "src/index.ts"],
});
