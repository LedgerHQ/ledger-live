import type { ChildProcess } from "child_process";
import { once } from "events";
import readline from "readline";
import { parseAutoUpgradeOptions, startAutoUpgrade } from "./utils/startAutoUpgrade.mts";

const { openInstalledApp } = await startAutoUpgrade(parseAutoUpgradeOptions());
console.log("Press Ctrl+C to stop serving the feed");
await reopenOnReturn(openInstalledApp(), openInstalledApp);

async function reopenOnReturn(firstApp: ChildProcess, openApp: () => ChildProcess) {
  // Outside terminal mode, Ctrl+C still sends SIGINT instead of being read as input.
  const input = readline.createInterface({ input: process.stdin, terminal: false });
  let runningApp = firstApp;
  for (;;) {
    await once(runningApp, "exit");
    console.log("Ledger Wallet closed: press Return to open it again, Ctrl+C to stop");
    // Nothing listens while the app runs, so a Return pressed then is dropped.
    await once(input, "line");
    runningApp = openApp();
  }
}
