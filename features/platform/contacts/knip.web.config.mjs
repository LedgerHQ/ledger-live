// The package still imports suffix-less `./ContactAvatar` and `./ContactNameInput`, so knip
// must run once per platform or it flags every `.web.tsx` / `.native.tsx` twin as unused.
import { createDualPlatformKnipConfig } from "../../../knip.config.base.mjs";

export default createDualPlatformKnipConfig({
  packagePath: "features/platform/contacts",
  platform: "web",
  entry: ["src/index.ts", "src/web.ts", "src/device/intents/index.ts"],
  additionalProjectExcludes: ["src/index.native.ts"],
});
