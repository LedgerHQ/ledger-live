import { config as baseConfig } from "./wdio.shared.conf.ts";
import { findFreePort } from "../bridge/server.ts";
import { WorkerPool } from "../workers/WorkerPool.ts";

const baseCapa: Omit<WebdriverIO.Capabilities, "custom:capa"> = {
  platformName: "Android",
  "appium:platformVersion": "16.0",
  "appium:automationName": "UiAutomator2",
  "appium:app": `../../apps/ledger-live-mobile/android/app/build/outputs/apk/detox/app-${process.env.CI ? "x86_64" : "arm64-v8a"}-detox.apk`,
  "appium:adbExecTimeout": 30_000,
  "appium:skipLogcatCapture": false,
  "appium:clearDeviceLogsOnStart": true,
  "appium:ensureWebviewsHavePages": true,
  "appium:disableWindowAnimation": true,
};

const workerConfigs: WebdriverIO.Capabilities[] = [
  {
    ...baseCapa,
    port: 4723,
    "appium:avd": "Android_Emulator",
    "appium:systemPort": 8201,
    "appium:chromedriverPort": 8210,
    "appium:mjpegServerPort": 7810,
    "custom:capa": { websocketPort: 8098 },
  },
  {
    ...baseCapa,
    port: 4724,
    "appium:avd": "Android_Emulator_2",
    "appium:systemPort": 8202,
    "appium:chromedriverPort": 8211,
    "appium:mjpegServerPort": 7811,
    "custom:capa": { websocketPort: 8099 },
  },
  {
    ...baseCapa,
    port: 4725,
    "appium:avd": "Android_Emulator_3",
    "appium:systemPort": 8203,
    "appium:chromedriverPort": 8212,
    "appium:mjpegServerPort": 7812,
    "custom:capa": { websocketPort: 8100 },
  },
];

const workerPool = new WorkerPool(workerConfigs);

export const config: WebdriverIO.Config = {
  ...baseConfig,
  // ============
  // Capabilities
  // ============
  // For all capabilities please check
  // https://github.com/appium/appium-uiautomator2-driver
  capabilities: [workerConfigs[0] /* template; instances are differentiated in onWorkerStart */],
  /**
   * Gets executed before a worker process is spawned and can be used to initialize specific service
   * for that worker as well as modify runtime environments in an async fashion.
   * @param  {string} cid      capability id (e.g 0-0)
   * @param  {object} caps     object containing capabilities for session that will be spawn in the worker
   * @param  {object} specs    specs to be run in the worker process
   * @param  {object} args     object that will be merged with the main configuration once worker is initialized
   * @param  {object} execArgv list of string arguments passed to the worker process
   */
  onWorkerStart: async function (cid, caps, specs, args, execArgv) {
    if (Number(process.env.WDIO_INSTANCES) > 1) {
      const emulator = await workerPool.acquire(cid);
      Object.assign(caps, { ...emulator });
    }

    // dynamic websocket to reduce port clash
    const websocketPort = await findFreePort();
    caps["custom:capa"].websocketPort = websocketPort;
    caps["appium:optionalIntentArguments"] = [
      `-e mock "0"`,
      `-e wsPort ${websocketPort}`,
      `-e disable_broadcast 1`,
      `-e IS_TEST true`,
    ].join(" ");
  },

  /**
   * Gets executed just after a worker process has exited.
   * @param  {string} cid      capability id (e.g 0-0)
   * @param  {number} exitCode 0 - success, 1 - fail
   * @param  {object} specs    specs to be run in the worker process
   * @param  {number} retries  number of retries used
   */
  onWorkerEnd: function (cid, exitCode, specs, retries) {
    workerPool.release(cid); // ← main process, keyed by cid
  },
};
