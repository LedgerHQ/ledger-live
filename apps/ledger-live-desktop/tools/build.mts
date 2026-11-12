import { parseArgs } from "util";
import { build, openApp, parseBump } from "./utils/builds.mts";

const { values } = parseArgs({
  options: {
    bump: { type: "string" },
    dir: { type: "boolean", default: false },
  },
});

const { unpackedApp } = await build(parseBump(values.bump), { dir: values.dir });
openApp(unpackedApp);
