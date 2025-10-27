import { logMemoryUsage } from "./helpers/commonHelpers";
import detox from "detox/internals";

import { ServerData } from "./bridge/types";
import { Subject } from "rxjs";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

import { ElementHelpers } from "./helpers/elementHelpers";
import expect from "expect";

import { Application } from "./page";

globalThis.app = new Application();
globalThis.webSocket = {
  wss: undefined,
  ws: undefined,
  messages: {},
  e2eBridgeServer: new Subject<ServerData>(),
};
globalThis.jestExpect = expect;
globalThis.Currency = Currency;
globalThis.Account = Account;

globalThis.waitForElementById = ElementHelpers.waitForElementById;
globalThis.waitForElementByText = ElementHelpers.waitForElementByText;
globalThis.getElementById = ElementHelpers.getElementById;
globalThis.getElementsById = ElementHelpers.getElementsById;
globalThis.getElementByText = ElementHelpers.getElementByText;
globalThis.getWebElementById = ElementHelpers.getWebElementById;
globalThis.getWebElementByTag = ElementHelpers.getWebElementByTag;
globalThis.IsIdVisible = ElementHelpers.IsIdVisible;
globalThis.tapById = ElementHelpers.tapById;
globalThis.tapByText = ElementHelpers.tapByText;
globalThis.tapByElement = ElementHelpers.tapByElement;
globalThis.typeTextById = ElementHelpers.typeTextById;
globalThis.typeTextByElement = ElementHelpers.typeTextByElement;
globalThis.clearTextByElement = ElementHelpers.clearTextByElement;
globalThis.performScroll = ElementHelpers.performScroll;
globalThis.scrollToText = ElementHelpers.scrollToText;
globalThis.scrollToId = ElementHelpers.scrollToId;
globalThis.getTextOfElement = ElementHelpers.getTextOfElement;
globalThis.getIdByRegexp = ElementHelpers.getIdByRegexp;
globalThis.getIdOfElement = ElementHelpers.getIdOfElement;
globalThis.getWebElementByTestId = ElementHelpers.getWebElementByTestId;
globalThis.getWebElementsByIdAndText = ElementHelpers.getWebElementsByIdAndText;
globalThis.getWebElementText = ElementHelpers.getWebElementText;
globalThis.getWebElementValue = ElementHelpers.getWebElementValue;
globalThis.waitWebElementByTestId = ElementHelpers.waitWebElementByTestId;
globalThis.tapWebElementByTestId = ElementHelpers.tapWebElementByTestId;
globalThis.typeTextByWebTestId = ElementHelpers.typeTextByWebTestId;

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

    const detoxConfigFile = require("../detox.config.js");
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

      // Force garbage collection
      global.gc?.();
    } catch (error) {
      console.warn("Error during environment teardown :", error);
    }

    await super.teardown();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleTestEvent(event: any, state: any) {
    await super.handleTestEvent(event, state);

    if (event.name === "run_start") {
      await logMemoryUsage();
    }
  }
}
