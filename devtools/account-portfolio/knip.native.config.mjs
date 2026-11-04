import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/account-portfolio",
  platform: "native",
  entry: ["src/components/AssetIcon/AssetIcon.native.tsx"],
});
