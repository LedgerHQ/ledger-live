import { config as baseConfig } from "./wdio.shared.conf.js";

const WS_PORT_1 = 8098;
const WS_PORT_2 = 8099;

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
        args: [
          "-mock",
          "0",
          "-disable_broadcast",
          "1",
          "-IS_TEST",
          "true",
          `-wsPort`,
          `${WS_PORT_1}`,
        ],
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
        args: [
          "-mock",
          "0",
          "-disable_broadcast",
          "1",
          "-IS_TEST",
          "true",
          `-wsPort`,
          `${WS_PORT_2}`,
        ],
      },
      "custom:capa": {
        websocketPort: WS_PORT_2,
      },
    },
  ],
};
