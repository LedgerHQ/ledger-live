import { takeSpeculosScreenshot } from "./utils/speculosUtils";
import { Circus } from "@jest/types";
import { logMemoryUsage, setupEnvironment } from "./helpers/commonHelpers";

import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { CLI } from "./utils/cliUtils";
import { NativeElementHelpers, WebElementHelpers } from "./helpers/elementHelpers";
import { $TmsLink, Step, $Tag } from "jest-allure2-reporter/api";
import { Subject } from "rxjs";
import expect from "expect";
import detox from "detox/internals";

setupEnvironment();

Object.assign(globalThis, {
  Step,
  $TmsLink,
  $Tag,
});

import { Application } from "./page/index";
globalThis.app = new Application();
globalThis.IS_FAILED = false;

globalThis.speculosDevices = new Map<string, number>();
globalThis.proxySubscriptions = new Map<number, { port: number; subscription: any }>();
globalThis.webSocket = {
  wss: undefined,
  ws: undefined,
  messages: {},
  e2eBridgeServer: new Subject(),
};
globalThis.pendingCallbacks = new Map<string, { callback: (data: string) => void }>();

// Test globals
Object.assign(globalThis, {
  Account,
  AppInfos,
  CLI,
  Currency,
  Delegate,
  detoxExpect: NativeElementHelpers.expect,
  Fee,
  jestExpect: expect,
  Swap,
  TokenAccount,
  Transaction,
});

// Native helpers
Object.assign(globalThis, {
  clearTextByElement: NativeElementHelpers.clearTextByElement,
  countElementsById: NativeElementHelpers.countElementsById,
  detoxExpect: NativeElementHelpers.expect,
  getAttributesOfElement: NativeElementHelpers.getAttributesOfElement,
  getElementById: NativeElementHelpers.getElementById,
  getElementByIdAndText: NativeElementHelpers.getElementByIdAndText,
  getElementByText: NativeElementHelpers.getElementByText,
  getElementsById: NativeElementHelpers.getElementsById,
  getIdByRegexp: NativeElementHelpers.getIdByRegexp,
  getIdOfElement: NativeElementHelpers.getIdOfElement,
  getTextOfElement: NativeElementHelpers.getTextOfElement,
  IsIdVisible: NativeElementHelpers.isIdVisible,
  scrollToId: NativeElementHelpers.scrollToId,
  scrollToText: NativeElementHelpers.scrollToText,
  tapByElement: NativeElementHelpers.tapByElement,
  tapById: NativeElementHelpers.tapById,
  tapByText: NativeElementHelpers.tapByText,
  typeTextByElement: NativeElementHelpers.typeTextByElement,
  typeTextById: NativeElementHelpers.typeTextById,
  waitForElement: NativeElementHelpers.waitForElement,
  waitForElementById: NativeElementHelpers.waitForElementById,
  waitForElementByText: NativeElementHelpers.waitForElementByText,
  waitForElementNotVisible: NativeElementHelpers.waitForElementNotVisible,
});

// Web helpers
Object.assign(globalThis, {
  getCurrentWebviewUrl: WebElementHelpers.getCurrentWebviewUrl,
  getValueByWebTestId: WebElementHelpers.getValueByWebTestId,
  getWebElementByCssSelector: WebElementHelpers.getWebElementByCssSelector,
  getWebElementById: WebElementHelpers.getWebElementById,
  getWebElementByTag: WebElementHelpers.getWebElementByTag,
  getWebElementByTestId: WebElementHelpers.getWebElementByTestId,
  getWebElementsByCssSelector: WebElementHelpers.getWebElementsByCssSelector,
  getWebElementsByIdAndText: WebElementHelpers.getWebElementsByIdAndText,
  getWebElementsText: WebElementHelpers.getWebElementsText,
  getWebElementText: WebElementHelpers.getWebElementText,
  scrollToWebElement: WebElementHelpers.scrollToWebElement,
  tapWebElementByElement: WebElementHelpers.tapWebElementByElement,
  tapWebElementByTestId: WebElementHelpers.tapWebElementByTestId,
  typeTextByWebTestId: WebElementHelpers.typeTextByWebTestId,
  waitForCurrentWebviewUrlToContain: WebElementHelpers.waitForCurrentWebviewUrlToContain,
  waitForWebElementToBeEnabled: WebElementHelpers.waitForWebElementToBeEnabled,
  waitWebElementByTestId: WebElementHelpers.waitWebElementByTestId,
});

// @ts-expect-error DetoxEnvironment is not typed
import DetoxEnvironment from "detox/runners/jest/testEnvironment";

export default class TestEnvironment extends DetoxEnvironment {
  declare global: typeof globalThis;

  async setup() {
    const workerId = Number(process.env.JEST_WORKER_ID ?? "1");
    if (workerId > 1) this.setupDeviceForSecondaryWorker(workerId);
    await super.setup();
  }

  private setupDeviceForSecondaryWorker(workerId: number) {
    const configName = process.env.DETOX_CONFIGURATION;
    if (!configName) throw new Error("Missing DETOX_CONFIGURATION environment variable");

    const detoxConfigFile = require("./detox.config.js");
    const targetConfig = detoxConfigFile.configurations[configName];

    const deviceName = `${targetConfig.device}${workerId}`;
    const targetDevice = detoxConfigFile.devices[deviceName];

    if (!targetDevice) {
      throw new Error(
        `Device configuration not found for ${deviceName}, check your detox config file`,
      );
    }

    Object.assign(detox.config, { device: targetDevice });
  }

  async teardown() {
    try {
      // Clean up WebSocket connections
      if (this.global.webSocket?.wss) {
        this.global.webSocket.wss.close();
        this.global.webSocket.wss = undefined;
      }
      if (this.global.webSocket?.ws && this.global.webSocket.ws.readyState !== 3) {
        this.global.webSocket.ws.close();
        this.global.webSocket.ws = undefined;
      }

      // Complete RxJS subjects
      if (this.global.webSocket?.e2eBridgeServer && !this.global.webSocket.e2eBridgeServer.closed) {
        this.global.webSocket.e2eBridgeServer.complete();
      }

      // Clean up proxy subscriptions
      if (this.global.proxySubscriptions) {
        for (const [_, { subscription }] of this.global.proxySubscriptions) {
          if (subscription?.unsubscribe && !subscription.closed) {
            subscription.unsubscribe();
          }
        }
        this.global.proxySubscriptions.clear();
      }

      // Force garbage collection
      global.gc?.();
    } catch (error) {
      log.info("Error during environment teardown :", error);
    }

    await super.teardown();
  }

  async handleTestEvent(event: Circus.Event, state: Circus.State) {
    await super.handleTestEvent(event, state);

    if (["hook_failure", "test_fn_failure"].includes(event.name)) {
      this.global.IS_FAILED = true;
    }

    if (this.global.IS_FAILED && ["test_fn_start", "test_fn_failure"].includes(event.name)) {
      await takeSpeculosScreenshot();
    }

    if (event.name === "run_start") {
      await logMemoryUsage();
    }
  }
}
