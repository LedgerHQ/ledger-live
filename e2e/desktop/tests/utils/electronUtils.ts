import { ElectronApplication, _electron as electron } from "@playwright/test";
import * as path from "path";
const { execSync } = require("child_process");

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
  try {
    const appPath = path.join(
      __dirname,
      "../../../../apps/ledger-live-desktop/.webpack/main.bundle.js",
    );
    console.warn(appPath);
    console.log(execSync(`ls -l ${appPath}`).toString());
    console.warn(
      execSync(
        `ls -l ${path.join(__dirname, "../../../../apps/ledger-live-desktop/.webpack/")}`,
      ).toString(),
    );

    console.warn(
      execSync(
        `ls -l ${path.join(__dirname, "../../../../apps/ledger-live-desktop/.webpack/assets/")}`,
      ).toString(),
    );

    const app = await electron.launch({
      args: [
        appPath,
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

    app.on("window", async page => {
      page.on("console", msg => {
        console.log(`[Console] ${msg.type()}: ${msg.text()}`);
      });

      page.on("pageerror", error => {
        console.error(`[Page Error] ${error.message}`);
      });

      page.on("response", response => {
        console.log(`[Response] ${response.url()} - ${response.status()}`);
      });

      page.on("requestfailed", request => {
        console.error(`[Request Failed] ${request.url()} - ${request.failure()?.errorText}`);
      });
    });
    return app;
  } catch (error) {
    console.error("Error launching Electron app:", error);
    throw error;
  }
}
