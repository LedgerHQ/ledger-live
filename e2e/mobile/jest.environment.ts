import { takeSpeculosScreenshot } from "./utils/speculosUtils";
import { Circus } from "@jest/types";
import { logMemoryUsage, takeAppScreenshot, setupEnvironment } from "./helpers/commonHelpers";
import { config as detoxConfig } from "detox/internals";
import { Subject } from "rxjs";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { CLI } from "./utils/cliUtils";
import { NativeElementHelpers, WebElementHelpers } from "./helpers/elementHelpers";
import expect from "expect";
import { Application } from "./page/index";
import { ServerData } from "../../apps/ledger-live-mobile/e2e/bridge/types";

// @ts-expect-error detox doesn't provide type declarations for this module
import DetoxEnvironment from "detox/runners/jest/testEnvironment";

export default class TestEnvironment extends DetoxEnvironment {
  declare global: typeof globalThis;

  async setup() {
    const workerId = Number(process.env.JEST_WORKER_ID ?? "1");
    if (workerId > 1) this.setupDeviceForSecondaryWorker(workerId);
    await super.setup();

    setupEnvironment();

    const speculosDevicesMap = new Map<string, number>();
    const proxySubscriptionsMap = new Map<number, { port: number; subscription: any }>();
    const webSocketObj = {
      wss: undefined,
      ws: undefined,
      messages: {},
      e2eBridgeServer: new Subject<ServerData>(),
    };
    const pendingCallbacksMap = new Map<string, { callback: (data: string) => void }>();
    const appInstance = new Application();

    this.global.app = appInstance;
    this.global.IS_FAILED = false;
    this.global.speculosDevices = speculosDevicesMap;
    this.global.proxySubscriptions = proxySubscriptionsMap;
    this.global.webSocket = webSocketObj;
    this.global.pendingCallbacks = pendingCallbacksMap;

    globalThis.app = appInstance;
    globalThis.IS_FAILED = false;
    globalThis.speculosDevices = speculosDevicesMap;
    globalThis.proxySubscriptions = proxySubscriptionsMap;
    globalThis.webSocket = webSocketObj;
    globalThis.pendingCallbacks = pendingCallbacksMap;

    const enums = {
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
    };

    const nativeHelpers = {
      clearTextByElement: NativeElementHelpers.clearTextByElement,
      countElementsById: NativeElementHelpers.countElementsById,
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
    };

    const webHelpers = {
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
      waitForWebElementToMatchRegex: WebElementHelpers.waitForWebElementToMatchRegex,
      waitWebElementByTestId: WebElementHelpers.waitWebElementByTestId,
    };

    Object.assign(this.global, enums);
    Object.assign(this.global, nativeHelpers);
    Object.assign(this.global, webHelpers);

    Object.assign(globalThis, enums);
    Object.assign(globalThis, nativeHelpers);
    Object.assign(globalThis, webHelpers);
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

    Object.assign(detoxConfig, { device: targetDevice });
  }

  async teardown() {
    try {
      if (this.global.webSocket?.wss) {
        this.global.webSocket.wss.close();
        this.global.webSocket.wss = undefined;
      }
      if (this.global.webSocket?.ws && this.global.webSocket.ws.readyState !== 3) {
        this.global.webSocket.ws.close();
        this.global.webSocket.ws = undefined;
      }

      if (this.global.webSocket?.e2eBridgeServer && !this.global.webSocket.e2eBridgeServer.closed) {
        this.global.webSocket.e2eBridgeServer.complete();
      }

      if (this.global.proxySubscriptions) {
        for (const [_, { subscription }] of this.global.proxySubscriptions) {
          if (subscription?.unsubscribe && !subscription.closed) {
            subscription.unsubscribe();
          }
        }
        this.global.proxySubscriptions.clear();
      }

      // Clean up DeviceManagementKit transport connections to prevent TLS socket errors
      // The static byBase Map can hold stale connections that cause "Cannot read properties of null"
      // Using dynamic import to avoid module loading side effects during environment initialization
      try {
        const { DeviceManagementKitTransportSpeculos } = await import(
          "@ledgerhq/live-dmk-speculos"
        );
        for (const [_baseUrl, entry] of DeviceManagementKitTransportSpeculos.byBase) {
          if (entry.sessionId && entry.dmk?.disconnect) {
            await entry.dmk.disconnect({ sessionId: entry.sessionId }).catch(() => {});
          }
        }
        DeviceManagementKitTransportSpeculos.byBase.clear();
      } catch {
        // Ignore cleanup errors
      }

      global.gc?.();
    } catch (error) {
      console.info("Error during environment teardown :", sanitizeError(error));
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
      await takeAppScreenshot("Test Failure");
    }

    if (event.name === "run_start") {
      await logMemoryUsage();
    }
  }
}
