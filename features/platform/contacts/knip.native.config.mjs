// The package still imports suffix-less `./ContactAvatar` and `./ContactNameInput`, so knip
// must run once per platform or it flags every `.web.tsx` / `.native.tsx` twin as unused.
import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/contacts",
  platform: "native",
  entry: ["src/index.native.ts", "src/device/intents/index.ts"],
  additionalProjectExcludes: ["src/index.ts", "src/web.ts"],
});
