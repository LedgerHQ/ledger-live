import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/trustchain",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
