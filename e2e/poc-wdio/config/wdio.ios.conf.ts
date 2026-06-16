import { config as baseConfig } from "./wdio.shared.conf.ts";
import { findFreePort } from "../bridge/server.ts";
import { WorkerPool } from "../workers/WorkerPool.ts";

const baseCapa: Omit<WebdriverIO.Capabilities, "custom:capa"> = {
  platformName: "iOS",
  "appium:platformVersion": process.env.CI ? "26.3" : "26.2",
  "appium:automationName": "XCUITest",
  "appium:wdaLaunchTimeout": 120_000,
  "appium:app":
    "../../apps/ledger-live-mobile/ios/build/Build/Products/Release-iphonesimulator/ledgerlivemobile.app",
};

const workerConfigs: WebdriverIO.Capabilities[] = [
  {
    ...baseCapa,
    port: 4723,
    "appium:deviceName": "iOS Simulator",
    "appium:wdaLocalPort": 8203,
    "appium:mjpegServerPort": 9100,
    "custom:capa": { websocketPort: 8098 },
  },
  {
    ...baseCapa,
    port: 4724,
    "appium:deviceName": "iOS Simulator 2",
    "appium:wdaLocalPort": 8204,
    "appium:mjpegServerPort": 9101,
    "custom:capa": { websocketPort: 8099 },
  },
  {
    ...baseCapa,
    port: 4725,
    "appium:deviceName": "iOS Simulator 3",
    "appium:wdaLocalPort": 8205,
    "appium:mjpegServerPort": 9102,
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
  // https://github.com/appium/appium-xcuitest-driver
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
    caps["appium:processArguments"] = {
      // TODO: find free port dynamically
      args: [
        "-mock",
        "0",
        "-disable_broadcast",
        "1",
        "-IS_TEST",
        "true",
        `-wsPort`,
        `${websocketPort}`,
      ],
    };
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
