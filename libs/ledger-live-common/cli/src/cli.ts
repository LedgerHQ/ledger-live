/* eslint-disable no-console */

import { deserializeError } from "@ledgerhq/errors";
import { from } from "rxjs";
import commandLineArgs from "command-line-args";
import { closeAllDevices } from "./live-common-setup";
import commandsMain from "./commands-index";
// TODO cli-transaction.js => cli.js
import perFamily from "@ledgerhq/live-common/lib/generated/cli-transaction";

const commands = {
  ...Object.values(perFamily)
    .map((m: any) => typeof m === "object" && m && m.commands)
    .reduce((acc, c) => ({ ...acc, ...c }), {}),
  ...commandsMain,
};

const mainOptions = commandLineArgs(
  [
    { name: "command", defaultOption: true },
    { name: "help", alias: "h", type: Boolean },
  ],
  {
    stopAtFirstUnknown: true,
  }
);

if (mainOptions.help || !mainOptions.command) {
  console.log("Ledger Live @ https://github.com/LedgerHQ/ledger-live-common");
  console.log("");
  console.log("Usage: ledger-live <command> ...");
  console.log("");
  for (const k in commands) {
    const cmd = commands[k];
    console.log(
      `Usage: ledger-live ${k} `.padEnd(30) +
        (cmd.description ? `# ${cmd.description}` : "")
    );
    for (const opt of cmd.args) {
      let str = opt.alias ? ` -${opt.alias}, ` : "     ";
      str += `--${opt.name}`;
      if ((opt.type && opt.type !== Boolean) || opt.typeDesc) {
        str += ` <${opt.typeDesc || opt.type.name}>`;
      }
      if (opt.desc) {
        str = str.padEnd(30) + `: ${opt.desc}`;
      }
      console.log(str);
    }
    console.log("");
  }
  console.log("");
  console.log("                ````                    ");
  console.log("           `.--:::::                    ");
  console.log("        `.-:::::::::       ````         ");
  console.log("       .://///:-..``     `-/+++/-`      ");
  console.log("     `://///-`           -++++++o/.     ");
  console.log("    `/+++/:`            -+++++osss+`    ");
  console.log("   `:++++:`            ./++++-/osss/`   ");
  console.log("   .+++++`             `-://- .ooooo.   ");
  console.log("   -+ooo/`                ``  `/oooo-   ");
  console.log("   .oooo+` .::-.`             `+++++.   ");
  console.log("   `+oooo:./+++/.             -++++/`   ");
  console.log("    -ossso+++++:`            -/+++/.    ");
  console.log("     -ooo+++++:`           .://///.     ");
  console.log("      ./+++++/`       ``.-://///:`      ");
  console.log("        `---.`      -:::::///:-.        ");
  console.log("                    :::::::-.`          ");
  console.log("                    ....``              ");
  console.log("");
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
const options = commandLineArgs(cmd.args, { argv, stopAtFirstUnknown: true });
from(cmd.job(options)).subscribe({
  next: (log) => {
    if (log !== undefined) console.log(log);
  },
  error: (error) => {
    const e = error instanceof Error ? error : deserializeError(error);
    if (process.env.VERBOSE || process.env.VERBOSE_FILE) console.error(e);
    else console.error(String(e.message || e));
    process.exit(1);
  },
  complete: () => {
    closeAllDevices();
  },
});

let sigIntSent;
process.on("SIGINT", () => {
  if (!sigIntSent) {
    sigIntSent = Date.now();
    closeAllDevices();
  } else {
    if (Date.now() - sigIntSent > 3000) {
      console.error("was not able to terminate gracefully. exiting");
      process.exit(1);
    }
  }
});
