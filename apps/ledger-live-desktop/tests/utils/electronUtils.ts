import { ElectronApplication, _electron as electron } from "@playwright/test";
import * as path from "path";

import { deserializeError } from "@ledgerhq/errors";
import { from } from "rxjs";
import commandsMain from "@ledgerhq/live-cli/src/commands-index";
import { initSpeculosTransport } from "@ledgerhq/live-cli/src/live-common-setup";
export async function launchApp({
  env,
  lang,
  theme,
  userdataDestinationPath,
  simulateCamera,
  windowSize,
}: {
  env: Record<string, string>;
  lang: string;
  theme: "light" | "dark" | "no-preference" | undefined;
  userdataDestinationPath: string;
  simulateCamera?: string;
  windowSize: { width: number; height: number };
}): Promise<ElectronApplication> {
  return await electron.launch({
    args: [
      `${path.join(__dirname, "../../.webpack/main.bundle.js")}`,
      `--user-data-dir=${userdataDestinationPath}`,
      "--force-device-scale-factor=1",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--enable-logging",
      ...(simulateCamera
        ? [
            "--use-fake-device-for-media-stream",
            `--use-file-for-fake-video-capture=${simulateCamera}`,
          ]
        : []),
    ],
    recordVideo: {
      dir: `${path.join(__dirname, "../artifacts/videos/")}`,
      size: windowSize,
    },
    env,
    colorScheme: theme,
    locale: lang,
    executablePath: require("electron/index.js"),
    timeout: 120000,
  });
}

export const executeLedgerCLI = async (commandName: string, args = {}) => {
  try {
    initSpeculosTransport();

    const commands = { ...(commandsMain as Record<string, any>) };
    const cmd = commands[commandName];
    if (!cmd) {
      throw new Error(`Command not found: ledger-live ${commandName}`);
    }
    const options = { ...args };

    return new Promise<void>((resolve, reject) => {
      from(cmd.job(options)).subscribe({
        next: log => {
          if (log !== undefined) console.log(log);
        },
        error: error => {
          const e = error instanceof Error ? error : deserializeError(error);
          console.error(e);
          reject(e);
        },
        complete: () => {
          resolve();
        },
      });
    });
  } catch (e) {
    console.error("Error executing the command:", e);
  }
};

export async function executeCommandCLI(commandName: string, args = {}): Promise<void> {
  try {
    await executeLedgerCLI(commandName, args);
  } catch (e) {
    console.error(e);
  }
}
