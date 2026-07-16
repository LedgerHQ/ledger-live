import fs from "fs";
import { execFileSync } from "child_process";
import { FullConfig } from "@playwright/test";
import { responseLogfilePath } from "./networkResponseLogger";

export default async function globalSetup(_config: FullConfig) {
  ensureElectronBinary();
  if (responseLogfilePath) {
    fs.unlink(responseLogfilePath, error => {
      if (error) {
        console.log("Could not remove response.log file");
      }

      console.log("Previous response.log file removed");
    });
  }
}

// Electron 42+ downloads its binary on first run rather than at install time; do it once here so parallel workers don't race extracting into dist/.
function ensureElectronBinary() {
  execFileSync(process.execPath, [require.resolve("electron/install.js")], { stdio: "inherit" });
}
