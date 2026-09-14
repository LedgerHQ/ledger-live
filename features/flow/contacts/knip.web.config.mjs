import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/contacts",
  platform: "web",
  entry: ["src/index.ts", "src/model.ts"],
  additionalProjectExcludes: ["src/**/native.ts"],
});
