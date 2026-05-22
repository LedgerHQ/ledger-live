import { config as baseConfig } from "./wdio.shared.conf.js";

export const config: WebdriverIO.Config = {
  ...baseConfig,
  // ============
  // Capabilities
  // ============
  // For all capabilities please check
  // https://github.com/appium/appium-uiautomator2-driver
  capabilities: [
    {
      platformName: "iOS",
      // For W3C the appium capabilities need to have an extension prefix
      // This is `appium:` for all Appium Capabilities
      "appium:deviceName": "iOS Simulator",
      "appium:automationName": "XCUITest",
      "appium:app":
        "../../apps/ledger-live-mobile/ios/build/Build/Products/Release-iphonesimulator/ledgerlivemobile.app",
      // react-native-launch-arguments reads intent extras (Appium path)
      "appium:processArguments": {
        // TODO: find free port dynamically
        args: ["-mock", "0", "-disable_broadcast", "1", "-IS_TEST", "true"],
      },
    },
  ],
};
