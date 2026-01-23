import { test as base, Page, ElectronApplication, ChromiumBrowserContext } from "@playwright/test";
import { mkdir, readFile, writeFile } from "fs/promises";
import merge from "lodash/merge";
import * as path from "path";
import { OptionalFeatureMap } from "@ledgerhq/types-live";
import { getEnv, setEnv } from "@ledgerhq/live-env";

import { Application } from "tests/page";
import { safeAppendFile, NANO_APP_CATALOG_PATH } from "tests/utils/fileUtils";
import { launchApp } from "tests/utils/electronUtils";
import { captureArtifacts } from "tests/utils/allureUtils";
import { randomUUID } from "crypto";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { lastValueFrom, Observable } from "rxjs";
import { CLI } from "tests/utils/cliUtils";
import { launchSpeculos, killSpeculos } from "tests/utils/speculosUtils";
import { SpeculosDevice } from "@ledgerhq/live-common/e2e/speculos";
import { NetworkThroughputLogger } from "tests/utils/networkResponseLogger";

type CliCommand = (appjsonPath: string) => Observable<unknown> | Promise<unknown> | string;

// Simulate intermittent connection with real dropouts
async function simulateIntermittentConnection(client: any, baseCondition: any) {
  let isOnline = true;
  const onlineDuration = 3000; // 3 secondes en ligne
  const offlineDuration = 50000; // 50 secondes hors ligne

  // Fonction pour basculer entre en ligne/hors ligne
  const toggleConnection = async () => {
    if (isOnline) {
      // Passer hors ligne
      await client.send("Network.emulateNetworkConditions", {
        offline: true,
        downloadThroughput: 0,
        uploadThroughput: 0,
        latency: 0,
      });
      console.log("🔴 Connection DROPPED (simulated)");
      isOnline = false;
      setTimeout(toggleConnection, offlineDuration);
    } else {
      // Repasser en ligne
      await client.send("Network.emulateNetworkConditions", baseCondition);
      console.log("🔄 Connection RESTORED (simulated)");
      isOnline = true;
      setTimeout(toggleConnection, onlineDuration);
    }
  };

  // Démarrer le cycle
  setTimeout(toggleConnection, onlineDuration);
}

// Network conditions for testing
function getNetworkCondition(condition: string) {
  const conditions = {
    // Fast 3G
    "3g-fast": {
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 40,
    },
    // Slow 3G
    "3g-slow": {
      offline: false,
      downloadThroughput: 500 * 1024 / 8, // 500 Kbps
      uploadThroughput: 500 * 1024 / 8, // 500 Kbps
      latency: 400,
    },
    // 2G
    "2g": {
      offline: false,
      downloadThroughput: 250 * 1024 / 8, // 250 Kbps
      uploadThroughput: 50 * 1024 / 8, // 50 Kbps
      latency: 800,
    },
    // Very slow connection
    "slow": {
      offline: false,
      downloadThroughput: 50 * 1024 / 8, // 50 Kbps
      uploadThroughput: 25 * 1024 / 8, // 25 Kbps
      latency: 2000,
    },
    // Simulate connection drops - version améliorée
    "unstable": {
      offline: false,
      downloadThroughput: 1 * 1024 * 1024 / 8, // 1 Mbps
      uploadThroughput: 500 * 1024 / 8, // 500 Kbps
      latency: 100,
    },
    // Simulate real connection interruptions
    "intermittent": {
      offline: false,
      downloadThroughput: 2 * 1024 * 1024 / 8, // 2 Mbps (normal)
      uploadThroughput: 1 * 1024 * 1024 / 8, // 1 Mbps (normal)
      latency: 50, // Normal latency
      // Cette condition sera gérée différemment pour simuler des coupures
    },
    // GPRS (very slow)
    "gprs": {
      offline: false,
      downloadThroughput: 50 * 1024 / 8, // 50 Kbps
      uploadThroughput: 20 * 1024 / 8, // 20 Kbps
      latency: 500,
    },
    // No throttling (default)
    "none": {
      offline: false,
      downloadThroughput: -1, // Unlimited
      uploadThroughput: -1,
      latency: 0,
    },
  };

  return conditions[condition as keyof typeof conditions] || conditions.none;
}

type TestFixtures = {
  lang: string;
  theme: "light" | "dark" | "no-preference" | undefined;
  speculosApp: AppInfos;
  userdata?: string;
  extraUserdataFiles?: Record<string, string>;
  settings: Record<string, unknown>;
  userdataDestinationPath: string;
  userdataOriginalFile?: string;
  userdataFile: string;
  env: Record<string, string>;
  electronApp: ElectronApplication;
  page: Page;
  featureFlags: OptionalFeatureMap;
  simulateCamera: string;
  app: Application;
  networkLogger: NetworkThroughputLogger;
  cliCommands?: CliCommand[];
  cliCommandsOnApp?: {
    app: AppInfos;
    cmd: CliCommand;
  }[];
};

const IS_NOT_MOCK = process.env.MOCK == "0";
const IS_DEBUG_MODE = !!process.env.PWDEBUG;
if (IS_NOT_MOCK) setEnv("DISABLE_APP_VERSION_REQUIREMENTS", true);
setEnv("SWAP_API_BASE", process.env.SWAP_API_BASE || "https://swap-stg.ledger-test.com/v5");

const DEFAULT_FEATURE_FLAGS: OptionalFeatureMap = {
  lldModularDrawer: {
    enabled: true,
    params: {
      add_account: true,
      earn_flow: true,
      live_app: true,
      receive_flow: false,
      send_flow: false,
      enableModularization: true,
      enableDialogDesktop: true,
      searchDebounceTime: 300,
      backendEnvironment: "PROD",
      live_apps_allowlist: [],
      live_apps_blocklist: [],
    },
  },
};

async function executeCliCommand(cmd: CliCommand, userdataDestinationPath?: string) {
  const promise = await cmd(`${userdataDestinationPath}/app.json`);
  const result = promise instanceof Observable ? await lastValueFrom(promise) : await promise;
  console.log("CLI result: ", result);
}

export const test = base.extend<TestFixtures>({
  env: undefined,
  lang: "en-US",
  theme: "dark",
  userdata: undefined,
  settings: { shareAnalytics: false, hasSeenAnalyticsOptInPrompt: true },
  featureFlags: undefined,
  simulateCamera: undefined,
  speculosApp: undefined,
  cliCommands: [],
  cliCommandsOnApp: [],
  extraUserdataFiles: undefined,

  app: async ({ page, electronApp }, use) => {
    const app = new Application(page, electronApp);
    await use(app);
  },

  networkLogger: async ({}, use, testInfo) => {
    const logger = new NetworkThroughputLogger(testInfo);
    await use(logger);
  },

  userdataDestinationPath: async ({}, use) => {
    await use(path.join(__dirname, "../artifacts/userdata", randomUUID()));
  },
  userdataOriginalFile: async ({ userdata }, use) => {
    await use(userdata && path.join(__dirname, "../userdata/", `${userdata}.json`));
  },
  userdataFile: async ({ userdataDestinationPath }, use) => {
    const fullFilePath = path.join(userdataDestinationPath, "app.json");
    await use(fullFilePath);
  },

  electronApp: async (
    {
      lang,
      theme,
      userdataDestinationPath,
      userdataOriginalFile,
      settings,
      env,
      featureFlags,
      simulateCamera,
      speculosApp,
      cliCommands,
      cliCommandsOnApp,
      extraUserdataFiles,
    },
    use,
    testInfo,
  ) => {
    // create userdata path
    await mkdir(userdataDestinationPath, { recursive: true });

    const fileUserData = userdataOriginalFile
      ? await readFile(userdataOriginalFile, { encoding: "utf-8" }).then(JSON.parse)
      : {};

    const userData = merge({ data: { settings } }, fileUserData);
    await writeFile(`${userdataDestinationPath}/app.json`, JSON.stringify(userData));
    if (extraUserdataFiles) {
      await Promise.all(
        Object.entries(extraUserdataFiles).map(([name, contents]) =>
          writeFile(path.join(userdataDestinationPath, name), contents),
        ),
      );
    }

    let speculos: SpeculosDevice | undefined;

    try {
      setEnv("PLAYWRIGHT_RUN", true);
      setEnv("E2E_NANO_APP_VERSION_PATH", NANO_APP_CATALOG_PATH);
      if (IS_NOT_MOCK && speculosApp) {
        setEnv("MOCK", "");
        process.env.MOCK = "";

        if (cliCommandsOnApp?.length) {
          for (const { app, cmd } of cliCommandsOnApp) {
            speculos = await launchSpeculos(app.name);
            CLI.registerSpeculosTransport(speculos.port.toString());
            await executeCliCommand(cmd, userdataDestinationPath);
            await killSpeculos(speculos.id);
          }
        }

        speculos = await launchSpeculos(speculosApp.name, testInfo.title);

        if (cliCommands?.length) {
          CLI.registerSpeculosTransport(speculos.port.toString());
          for (const cmd of cliCommands) {
            await executeCliCommand(cmd, userdataDestinationPath);
          }
        }
      }

      const mergedFeatureFlags = merge({}, DEFAULT_FEATURE_FLAGS, featureFlags);

      // default environment variables
      env = Object.assign(
        {
          ...process.env,
          VERBOSE: true,
          MOCK: IS_NOT_MOCK ? undefined : true,
          MOCK_COUNTERVALUES: IS_NOT_MOCK ? undefined : true,
          HIDE_DEBUG_MOCK: true,
          CI: process.env.CI || undefined,
          PLAYWRIGHT_RUN: true,
          CRASH_ON_INTERNAL_CRASH: true,
          LEDGER_MIN_HEIGHT: 768,
          FEATURE_FLAGS: JSON.stringify(mergedFeatureFlags),
          MANAGER_DEV_MODE: IS_NOT_MOCK ? true : undefined,
          SPECULOS_API_PORT: IS_NOT_MOCK ? getEnv("SPECULOS_API_PORT")?.toString() : undefined,
        },
        env,
      );

      // launch app
      const windowSize = { width: 1024, height: 768 };

      const electronApp: ElectronApplication = await launchApp({
        env,
        lang,
        theme,
        userdataDestinationPath,
        simulateCamera,
        windowSize,
      });

      await use(electronApp);

      // close app
      await electronApp.close();
    } finally {
      if (speculos) {
        await killSpeculos(speculos.id);
      }
    }
  },
  page: async ({ electronApp, networkLogger }, use, testInfo) => {
    // app is ready
    const page = await electronApp.firstWindow();
    // we need to give enough time for the playwright app to start. when the CI is slow, 30s was apprently not enough.
    page.setDefaultTimeout(120000);

    if (process.env.PLAYWRIGHT_CPU_THROTTLING_RATE) {
      const client = await (page.context() as ChromiumBrowserContext).newCDPSession(page);
      await client.send("Emulation.setCPUThrottlingRate", {
        rate: parseInt(process.env.PLAYWRIGHT_CPU_THROTTLING_RATE),
      });
    }

    // Network throttling simulation
    if (process.env.PLAYWRIGHT_NETWORK_CONDITION) {
      const client = await (page.context() as ChromiumBrowserContext).newCDPSession(page);
      const conditionName = process.env.PLAYWRIGHT_NETWORK_CONDITION;
      const networkCondition = getNetworkCondition(conditionName);

      await client.send("Network.enable");

      if (conditionName === "intermittent") {
        // Simulation spéciale de coupures intermittentes
        await simulateIntermittentConnection(client, networkCondition);
      } else {
        // Condition réseau normale
        await client.send("Network.emulateNetworkConditions", networkCondition);
      }

      console.log(`🌐 Network throttling enabled: ${conditionName}`);
    } else {
      // En mode neutre (vraie connexion CI), activer quand même Network.enable pour le monitoring
      const client = await (page.context() as ChromiumBrowserContext).newCDPSession(page);
      await client.send("Network.enable");
      console.log(`🌐 Network monitoring enabled (real CI connection)`);
    }

    // Définir le nom du test pour les logs d'erreur
    networkLogger.setCurrentTest(testInfo.title);

    // record all logs into an artifact
    const logFile = testInfo.outputPath("logs.log");
    page.on("console", msg => {
      const txt = msg.text();
      if (IS_DEBUG_MODE && msg.type() == "error") {
        console.error(txt);
      }
      if (IS_DEBUG_MODE) {
        // Direct Electron console to Node terminal.
        console.log(txt);
      }
      safeAppendFile(logFile, `${txt}\n`);
    });

    // Démarrer le monitoring réseau/live apps dès que la page est prête
    networkLogger.startMonitoring(page, electronApp);

    // app is loaded
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("#loader-container", { state: "hidden" });

    // use page in the test
    await use(page);

    // Générer et afficher uniquement le rapport final de connectivité réseau
    const connectivityReport = networkLogger.generateReport();

    // Afficher seulement le rapport final dans la console Playwright
    console.log(connectivityReport);

    // Écrire aussi le rapport dans un fichier d'artefacts pour archivage
    const reportFile = testInfo.outputPath("network-throughput-report.txt");
    await writeFile(reportFile, connectivityReport);

    // Logs concis pour la CI - seulement les métriques critiques
    const stats = networkLogger.getStats();

    // Afficher seulement s'il y a des problèmes critiques avec le nom du test
    if (stats.connectionErrors > 0 || stats.timeouts > 0 || stats.connectionDowntime > 0) {
      console.log(`🚨 LIVEAPP_ISSUES [${testInfo.title}]: ${stats.connectionErrors} errors, ${stats.timeouts} timeouts, ${stats.connectionDowntime}ms downtime`);
    } else {
      console.log(`✅ LIVEAPP_OK [${testInfo.title}]: No critical issues detected`);
    }

    // Format GitHub Actions pour les métriques importantes
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::set-output name=liveapp-errors::${stats.connectionErrors}`);
      console.log(`::set-output name=liveapp-timeouts::${stats.timeouts}`);
      console.log(`::set-output name=liveapp-downtime::${stats.connectionDowntime}`);
      console.log(`::set-output name=liveapp-has-issues::${(stats.connectionErrors > 0 || stats.timeouts > 0 || stats.connectionDowntime > 0)}`);
    }

    // Take screenshot and video only on failure
    if (testInfo.status !== "passed") {
      await captureArtifacts(page, testInfo);
    }

    //Remove video if test passed
    if (testInfo.status === "passed") {
      await electronApp.close();
      await page.video()?.delete();
    }
  },
});

export default test;
