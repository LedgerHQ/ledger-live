import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/shell",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
