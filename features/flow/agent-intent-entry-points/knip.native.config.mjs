import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/agent-intent-entry-points",
  platform: "native",
  entry: [],
  additionalProjectExcludes: ["src/index.ts"],
});
