import { ElectronApplication, _electron as electron } from "@playwright/test";
import * as path from "path";
import { withoutBroadcastLockEnv } from "tests/utils/broadcastLock";

export async function launchApp({
  env,
  lang,
  theme,
  userdataDestinationPath,
  simulateCamera,
  windowSize,
  recordVideo,
}: {
  env: Record<string, string>;
  lang: string;
  theme: "light" | "dark" | "no-preference" | undefined;
  userdataDestinationPath: string;
  simulateCamera?: string;
  windowSize: { width: number; height: number };
  recordVideo?: boolean;
}): Promise<ElectronApplication> {
  return await electron.launch({
    args: [
      `${path.join(__dirname, "../../../../apps/ledger-live-desktop/.webpack/main.bundle.js")}`,
      `--user-data-dir=${userdataDestinationPath}`,
      "--force-device-scale-factor=1",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--enable-logging",
      ...(process.platform === "darwin" ? ["--use-mock-keychain"] : []),

      ...(simulateCamera
        ? [
            "--use-fake-device-for-media-stream",
            `--use-file-for-fake-video-capture=${simulateCamera}`,
          ]
        : []),
    ],
    ...(recordVideo && {
      recordVideo: {
        dir: `${path.join(__dirname, "../artifacts/videos/")}`,
        size: windowSize,
      },
    }),
    env: withoutBroadcastLockEnv(env),
    colorScheme: theme,
    locale: lang,
    executablePath: require("electron/index.js"),
    timeout: 120000,
  });
}
