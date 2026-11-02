import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/flow-contacts-add-contact",
  platform: "web",
  entry: ["src/index.ts", "src/web/index.web.ts"],
});
