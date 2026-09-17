// `entry: []` on purpose: knip derives the entry from `package.json`. Both barrels are suffixed
// here, so the platform glob already excludes the other one.
import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/transport-panel",
  platform: "native",
  entry: [],
});
