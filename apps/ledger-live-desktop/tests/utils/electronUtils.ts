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
  console.log("Starting Electron application...");
  console.log("Environment variables:", env);
  console.log("Language:", lang);
  console.log("Theme:", theme);
  console.log("User data path:", userdataDestinationPath);
  console.log("Simulate camera:", simulateCamera);
  console.log("Window size:", windowSize);

  try {
    const app = await electron.launch({
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

    console.log("Electron application started successfully.");

    const page = await app.firstWindow();
    const screenshot = await page.screenshot();
    console.log(screenshot.toString("base64"));

    await page.evaluate(() => {
      window.saveLogs("tests/artifacts/logLLD.json");
    });

    return app;
  } catch (error) {
    console.error("Error launching Electron application:", error);
    throw error;
  }
}
