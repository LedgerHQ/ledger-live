import fs from "fs";
import { execFileSync } from "child_process";
import { FullConfig } from "@playwright/test";
import { responseLogfilePath } from "./networkResponseLogger";

export default async function globalSetup(_config: FullConfig) {
  // Pre-warm the Electron binary to avoid ETXTBSY race condition on Linux
  // when multiple Playwright workers try to execute it simultaneously on cold cache.
  try {
    const electronPath = require("electron") as string;
    execFileSync(electronPath, ["--version"], { timeout: 10000 });
  } catch {
    // ignore — we just want the binary to be fully unpacked
  }

  if (responseLogfilePath) {
    fs.unlink(responseLogfilePath, error => {
      if (error) {
        console.log("Could not remove response.log file");
      }

      console.log("Previous response.log file removed");
    });
  }
}
