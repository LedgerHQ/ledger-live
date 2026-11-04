import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/account-detail",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
