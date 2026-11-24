import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/bindings",
  platform: "native",
  entry: ["src/team-wallet-xp/isMockSessionSupported.native.ts"],
});
