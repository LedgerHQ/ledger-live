import { ElectronApplication, _electron as electron } from "@playwright/test";
import * as path from "path";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";
import { withoutExclusiveLockEnv } from "tests/utils/exclusiveLock";

const FIREBASE_REMOTE_CONFIG_HOST = "firebaseremoteconfig.googleapis.com";

/**
 * Sends Remote Config fetches through the capture proxy started by `mise run mitmproxy:capture-start`,
 * so one fetch serves every launch of the run. The PAC falls back to a direct connection if the proxy dies.
 */
function firebaseCaptureProxyArgs(): string[] {
  const proxy = process.env.E2E_FIREBASE_PROXY;
  const caSpki = process.env.E2E_FIREBASE_PROXY_SPKI;
  if (!proxy || !caSpki) return [];
  const pac = `function FindProxyForURL(url, host) { return host === "${FIREBASE_REMOTE_CONFIG_HOST}" ? "PROXY ${proxy}; DIRECT" : "DIRECT"; }`;
  return [
    `--proxy-pac-url=data:application/x-ns-proxy-autoconfig;base64,${Buffer.from(pac).toString("base64")}`,
    `--ignore-certificate-errors-spki-list=${caSpki}`,
  ];
}

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
      ...firebaseCaptureProxyArgs(),

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
    env: withoutExclusiveLockEnv(env),
    colorScheme: theme,
    locale: lang,
    executablePath: require("electron/index.js"),
    timeout: TIMEOUT.xxxlarge,
  });
}
