import { ElectronApplication, _electron as electron } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

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
  const artifactsDir = path.join(__dirname, "../artifacts");
  // Create unique netlog filename based on userdata path (which is unique per test)
  const userdataBasename = path.basename(userdataDestinationPath);
  const netLogPath = path.join(artifactsDir, `netlog-${userdataBasename}.log`);

  // Ensure artifacts directory exists
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  return await electron.launch({
    args: [
      `${path.join(__dirname, "../../../../apps/ledger-live-desktop/.webpack/main.bundle.js")}`,
      `--user-data-dir=${userdataDestinationPath}`,
      "--force-device-scale-factor=1",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--enable-logging",
      `--log-net-log=${netLogPath}`,
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
