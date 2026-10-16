import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/account-data",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
