import { config as baseConfig } from "./wdio.shared.conf.ts";
import { findFreePort } from "../bridge/server.ts";
import { WorkerPool } from "../workers/WorkerPool.ts";

const getAppPath = () => {
  const basePath = "../../apps/ledger-live-mobile/ios/build/Build/Products";
  return process.env.E2E_DEBUG_APP
    ? `${basePath}/Debug-iphonesimulator/ledgerlivemobile.app`
    : `${basePath}/Release-iphonesimulator/ledgerlivemobile.app`;
};

const workerConfigs: WebdriverIO.Capabilities[] = Array.from(
  { length: Number(process.env.E2E_WDIO_INSTANCES) || 1 },
  (_, i) =>
    ({
      platformName: "iOS",
      port: 4723 + i,
      // first simulator has no suffix
      "appium:deviceName": i === 0 ? "iOS Simulator" : `iOS Simulator ${i + 1}`,
      "appium:wdaLocalPort": 8203 + i,
      "appium:mjpegServerPort": 9100 + i,
      "custom:capa": { websocketPort: 8098 + i },
      "appium:platformVersion": process.env.CI ? "26.3" : "26.2",
      "appium:automationName": "XCUITest",
      "appium:wdaLaunchTimeout": 180_000,
      "appium:wdaStartupRetries": 3,
      "appium:app": getAppPath(),
    }) satisfies WebdriverIO.Capabilities,
);

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
    // dynamic websocket to reduce port clash
    const websocketPort = await findFreePort();

    // update the worker's capabilities with the acquired emulator from the pool
    const emulator = await workerPool.acquire(cid);
    Object.assign(caps, {
      ...emulator,
      "custom:capa": { websocketPort },
      "appium:processArguments": {
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
      },
    });
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
