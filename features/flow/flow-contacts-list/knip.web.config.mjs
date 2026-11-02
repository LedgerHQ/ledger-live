import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-list",
  platform: "web",
  entry: ["src/index.ts", "src/web/index.web.ts"],
  additionalIgnoreDependencies: ["class-variance-authority"],
});
