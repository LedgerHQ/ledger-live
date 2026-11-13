import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/receive",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
