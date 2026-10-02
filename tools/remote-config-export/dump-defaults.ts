// Dumps the type and code default of every LiveConfig key registered by the apps.
// Run from libs/ledger-live-common so that tsx and its dependencies resolve:
//   node --import tsx ../../tools/remote-config-export/dump-defaults.ts <outFile>
import fs from "node:fs";
import path from "node:path";
import { liveConfig } from "../../libs/ledger-live-common/src/config/sharedConfig";

const outFile = process.argv[2];
if (!outFile) throw new Error("usage: dump-defaults.ts <outFile>");

const defaults = Object.fromEntries(
  Object.entries(liveConfig).map(([key, { type, default: value }]) => [
    key,
    { type, default: value },
  ]),
);
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(defaults, null, 2));
console.log(`${Object.keys(defaults).length} default keys`);
