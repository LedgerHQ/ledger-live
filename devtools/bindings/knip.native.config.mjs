// One barrel, two passes: `usePayCardAuthProps` has a `.web` override and no `.native` twin, so
// each platform resolves `./usePayCardAuthProps` to a different file from the same `src/index.ts`.
import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/bindings",
  platform: "native",
  entry: [],
});
