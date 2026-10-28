import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/flow/account-detail-settings",
  platform: "web",
  entry: ["src/index.ts", "src/web/index.web.ts"],
});
