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
      platformName: "Android",
      // For W3C the appium capabilities need to have an extension prefix
      // This is `appium:` for all Appium Capabilities
      "appium:deviceName": "Android_Emulator",
      "appium:platformVersion": "16.0",
      "appium:automationName": "UiAutomator2",
      "appium:app":
        "../../apps/ledger-live-mobile/android/app/build/outputs/apk/detox/app-arm64-v8a-detox.apk",
    },
  ],
};
