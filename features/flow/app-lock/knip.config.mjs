import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/app-lock",
  platform: "web",
  entry: ["src/index.ts"],
  additionalProjectExcludes: [],
});
