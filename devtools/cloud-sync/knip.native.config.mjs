import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/cloud-sync",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
