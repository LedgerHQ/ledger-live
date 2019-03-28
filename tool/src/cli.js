// @flow
/* eslint-disable no-console */

import "babel-polyfill";
import "./live-common-setup";

import { from } from "rxjs";
import commandLineArgs from "command-line-args";
import commands from "./commands";

const mainOptions = commandLineArgs(
  [
    { name: "command", defaultOption: true },
    { name: "help", alias: "h", type: Boolean, desc: "display this help" }
  ],
  { stopAtFirstUnknown: true }
);

if (mainOptions.help || !mainOptions.command) {
  console.log("Usage: ledger-live <command> ...");
  console.log("");
  for (const k in commands) {
    const cmd = commands[k];
    console.log(`ledger-live ${k}`);
    for (const opt of cmd.args) {
      let str = `  --${opt.name}`;
      if (opt.alias) {
        str += ` (-${opt.alias})`;
      }
      if ((opt.type && opt.type !== Boolean) || opt.typeDesc) {
        str += ` <${opt.typeDesc || opt.type.name}>`;
      }
      if (opt.desc) {
        str += `: ${opt.desc}`;
      }
      console.log(str);
    }
    console.log("");
  }

  console.log(
    "Please be advised this software is experimental and shall not create any obligation for Ledger to continue to develop, offer, support or repair any of its features. The software is provided “as is.” Ledger shall not be liable for any damages whatsoever including loss of profits or data, business interruption arising from using the software."
  );
  process.exit(0);
}

const cmd = commands[mainOptions.command];
if (!cmd) {
  console.error("Command not found: ledger-live " + mainOptions.command);
  process.exit(1);
}
const argv = mainOptions._unknown || [];
const options = commandLineArgs(cmd.args, { argv });
from(cmd.job(options)).subscribe({
  next: log => {
    if (log !== undefined) console.log(log);
  },
  error: e => {
    if (process.env.VERBOSE) console.error(e);
    else console.error(String(e.message || e));
    process.exit(1);
  },
  complete: () => {}
});
