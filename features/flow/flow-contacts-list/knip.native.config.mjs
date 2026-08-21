import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-list",
  platform: "native",
  entry: ["src/index.native.ts"],
  additionalProjectExcludes: ["src/index.ts", "src/web.ts"],
  additionalIgnoreDependencies: ["class-variance-authority", "clsx", "tailwind-merge"],
});
