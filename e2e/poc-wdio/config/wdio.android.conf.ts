import { config as baseConfig } from "./wdio.shared.conf.js";

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
      platformName: "Android",
      // For W3C the appium capabilities need to have an extension prefix
      // This is `appium:` for all Appium Capabilities
      "appium:avd": "Android_Emulator",
      "appium:systemPort": 8201,
      "appium:chromedriverPort": 8210,
      "appium:mjpegServerPort": 7810,
      "appium:platformVersion": "16.0",
      "appium:automationName": "UiAutomator2",
      "appium:app": `../../apps/ledger-live-mobile/android/app/build/outputs/apk/detox/app-${process.env.CI ? "x86_64" : "arm64-v8a"}-detox.apk`,
      "appium:adbExecTimeout": 30_000,
      "appium:skipLogcatCapture": false, // optional: disable logcat capture
      "appium:clearDeviceLogsOnStart": true, // optional: clean buffer per run
      "appium:ensureWebviewsHavePages": true, // optional: stabilize webview context detection
      "appium:disableWindowAnimation": true, // optional: disable window animations to speed up tests
      "custom:capa": {
        websocketPort: WS_PORT_1,
      },
      // react-native-launch-arguments reads intent extras (Appium path)
      "appium:optionalIntentArguments": [
        `-e mock "0"`,
        // TODO: find free port dynamically
        `-e wsPort ${WS_PORT_1}`,
        `-e disable_broadcast 1`,
        `-e IS_TEST true`,
      ].join(" "),
    },
    {
      port: 4724,
      platformName: "Android",
      // For W3C the appium capabilities need to have an extension prefix
      // This is `appium:` for all Appium Capabilities
      "appium:avd": "Android_Emulator_2",
      "appium:systemPort": 8202,
      "appium:chromedriverPort": 8211,
      "appium:mjpegServerPort": 7811,
      "appium:platformVersion": "16.0",
      "appium:automationName": "UiAutomator2",
      "appium:app": `../../apps/ledger-live-mobile/android/app/build/outputs/apk/detox/app-${process.env.CI ? "x86_64" : "arm64-v8a"}-detox.apk`,
      "appium:adbExecTimeout": 30_000,
      "appium:skipLogcatCapture": false, // optional: disable logcat capture
      "appium:clearDeviceLogsOnStart": true, // optional: clean buffer per run
      "appium:ensureWebviewsHavePages": true, // optional: stabilize webview context detection
      "appium:disableWindowAnimation": true, // optional: disable window animations to speed up tests
      "custom:capa": {
        websocketPort: WS_PORT_2,
      },
      // react-native-launch-arguments reads intent extras (Appium path)
      "appium:optionalIntentArguments": [
        `-e mock "0"`,
        // TODO: find free port dynamically
        `-e wsPort ${WS_PORT_2}`,
        `-e disable_broadcast 1`,
        `-e IS_TEST true`,
      ].join(" "),
    },
    {
      port: 4725,
      platformName: "Android",
      // For W3C the appium capabilities need to have an extension prefix
      // This is `appium:` for all Appium Capabilities
      "appium:avd": "Android_Emulator_3",
      "appium:systemPort": 8203,
      "appium:chromedriverPort": 8212,
      "appium:mjpegServerPort": 7812,
      "appium:platformVersion": "16.0",
      "appium:automationName": "UiAutomator2",
      "appium:app": `../../apps/ledger-live-mobile/android/app/build/outputs/apk/detox/app-${process.env.CI ? "x86_64" : "arm64-v8a"}-detox.apk`,
      "appium:adbExecTimeout": 30_000,
      "appium:skipLogcatCapture": false, // optional: disable logcat capture
      "appium:clearDeviceLogsOnStart": true, // optional: clean buffer per run
      "appium:ensureWebviewsHavePages": true, // optional: stabilize webview context detection
      "appium:disableWindowAnimation": true, // optional: disable window animations to speed up tests
      "custom:capa": {
        websocketPort: WS_PORT_3,
      },
      // react-native-launch-arguments reads intent extras (Appium path)
      "appium:optionalIntentArguments": [
        `-e mock "0"`,
        // TODO: find free port dynamically
        `-e wsPort ${WS_PORT_3}`,
        `-e disable_broadcast 1`,
        `-e IS_TEST true`,
      ].join(" "),
    },
  ],
};
