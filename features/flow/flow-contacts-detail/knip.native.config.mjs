import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-detail",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts", "src/web.ts"],
});
