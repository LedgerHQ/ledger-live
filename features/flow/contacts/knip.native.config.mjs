import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/contacts",
  platform: "native",
  entry: ["src/index.native.ts", "src/model.ts", "src/jest.native.ts"],
  additionalProjectExcludes: ["src/index.ts", "src/**/web.ts"],
});
