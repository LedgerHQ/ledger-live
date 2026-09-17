// `entry: []` on purpose: knip derives the entry from `package.json`, and naming it again is
// what it reports as a redundant entry pattern.
import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/trustchain",
  platform: "web",
  entry: [],
});
