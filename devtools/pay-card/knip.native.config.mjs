// The native entry has to be named: this package's `package.json` points `exports`/`main` at the
// web barrel, so knip derives only that one. The web barrel carries no `.web` suffix either, so
// the platform glob doesn't exclude it.
import { createDualPlatformKnipConfig } from "../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "devtools/pay-card",
  platform: "native",
  entry: ["src/index.native.ts"],
  additionalProjectExcludes: ["src/index.ts"],
});
