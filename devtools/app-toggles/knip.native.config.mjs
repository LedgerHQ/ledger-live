import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/app-toggles",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
