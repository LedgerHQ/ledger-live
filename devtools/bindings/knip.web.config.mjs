// One barrel, two passes: `usePayCardAuthProps` has a `.web` override and no `.native` twin, so
// each platform resolves `./usePayCardAuthProps` to a different file from the same `src/index.ts`.
// knip resolves the unsuffixed sibling first, so the web override is named as an entry.
import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/bindings",
  platform: "web",
  entry: ["src/usePayCardAuthProps.web.ts"],
});
