import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/stake-position",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
