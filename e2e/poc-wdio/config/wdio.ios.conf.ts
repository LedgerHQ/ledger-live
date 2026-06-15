import { config as baseConfig } from "./wdio.shared.conf.ts";
import { findFreePort } from "../bridge/server.ts";

const WS_PORT_1 = 8098;
const WS_PORT_2 = 8099;
const WS_PORT_3 = 8100;

export const config: WebdriverIO.Config = {
  ...baseConfig,
  // ============
  // Capabilities
  // ============
  // For all capabilities please check
  // https://github.com/appium/appium-uiautomator2-driver
  capabilities: [
    {
      port: 4723,
      platformName: "iOS",
      // For W3C the appium capabilities need to have an extension prefix
      // This is `appium:` for all Appium Capabilities
      "appium:deviceName": "iOS Simulator",
      "appium:wdaLocalPort": 8203,
      "appium:mjpegServerPort": 9100,
      "appium:platformVersion": process.env.CI ? "26.3" : "26.2",
      "appium:automationName": "XCUITest",
      "appium:app":
        "../../apps/ledger-live-mobile/ios/build/Build/Products/Release-iphonesimulator/ledgerlivemobile.app",
      // react-native-launch-arguments reads intent extras (Appium path)
      "appium:processArguments": {
        // TODO: find free port dynamically
        args: ["-mock", "0", "-disable_broadcast", "1", "-IS_TEST", "true"],
      },
      "custom:capa": {
        websocketPort: WS_PORT_1,
      },
    },
    {
      port: 4724,
      platformName: "iOS",
      // For W3C the appium capabilities need to have an extension prefix
      // This is `appium:` for all Appium Capabilities
      "appium:deviceName": "iOS Simulator 2",
      "appium:wdaLocalPort": 8204,
      "appium:mjpegServerPort": 9101,
      "appium:platformVersion": process.env.CI ? "26.3" : "26.2",
      "appium:automationName": "XCUITest",
      "appium:app":
        "../../apps/ledger-live-mobile/ios/build/Build/Products/Release-iphonesimulator/ledgerlivemobile.app",
      // react-native-launch-arguments reads intent extras (Appium path)
      "appium:processArguments": {
        // TODO: find free port dynamically
        args: ["-mock", "0", "-disable_broadcast", "1", "-IS_TEST", "true"],
      },
      "custom:capa": {
        websocketPort: WS_PORT_2,
      },
    },
    {
      port: 4725,
      platformName: "iOS",
      // For W3C the appium capabilities need to have an extension prefix
      // This is `appium:` for all Appium Capabilities
      "appium:deviceName": "iOS Simulator 3",
      "appium:wdaLocalPort": 8205,
      "appium:mjpegServerPort": 9102,
      "appium:platformVersion": process.env.CI ? "26.3" : "26.2",
      "appium:automationName": "XCUITest",
      "appium:app":
        "../../apps/ledger-live-mobile/ios/build/Build/Products/Release-iphonesimulator/ledgerlivemobile.app",
      // react-native-launch-arguments reads intent extras (Appium path)
      "appium:processArguments": {
        // TODO: find free port dynamically
        args: ["-mock", "0", "-disable_broadcast", "1", "-IS_TEST", "true"],
      },
      "custom:capa": {
        websocketPort: WS_PORT_3,
      },
    },
  ],
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
    // find free port to reduce port clash
    const freePort = await findFreePort();
    caps["custom:capa"].websocketPort = freePort;
    caps["appium:processArguments"].args.push(`-wsPort`, `${freePort}`);
  },
};
