import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-list",
  platform: "web",
  entry: ["src/web.ts"],
  additionalIgnoreDependencies: ["class-variance-authority", "clsx", "tailwind-merge"],
});
