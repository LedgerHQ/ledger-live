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
      `${path.join(__dirname, "../../.webpack/main.bundle.js")}`,
      `--user-data-dir=${userdataDestinationPath}`,
      "--force-device-scale-factor=1",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--enable-logging",
      // When mitmproxy is active (HTTP_PROXY set), Chromium's renderer rejects
      // the mitmproxy CA cert because it uses its own cert store on Linux,
      // not the system store updated by update-ca-certificates.
      ...(process.env.HTTP_PROXY ? ["--ignore-certificate-errors"] : []),
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
