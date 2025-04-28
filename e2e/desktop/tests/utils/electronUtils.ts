import { ElectronApplication, _electron as electron } from "@playwright/test";
import * as path from "path";

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
      `${path.join(__dirname, "../../../../apps/ledger-live-desktop/.webpack/main.bundle.js")}`,
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
