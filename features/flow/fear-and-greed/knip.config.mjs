import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/fear-and-greed",
  platform: "web",
  entry: ["src/index.ts"],
  additionalProjectExcludes: [],
});
