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

import { launchApp } from "./helpers/commonHelpers";
import { close as closeBridge, getEnvs, getFlags, loadConfig } from "./bridge/server";
import { promises as fs } from "fs";
import path from "path";
import { formatEnvData, formatFlagsData } from "@ledgerhq/live-common/e2e";
import { log } from "detox";

const ARTIFACT_ENV_PATH = path.resolve("artifacts/environment.properties");

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
  async teardown() {
    const { CI, SHARD_INDEX, JEST_WORKER_ID } = process.env;
    if (CI && SHARD_INDEX === "1" && JEST_WORKER_ID === "1") {
      try {
        await launchApp();
        await loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);
        await waitForElementById("settings-icon", 120_000);

        const flagsData = formatFlagsData(JSON.parse(await getFlags()));
        const envsData = formatEnvData(JSON.parse(await getEnvs()));
        await fs.appendFile(ARTIFACT_ENV_PATH, flagsData + envsData);

        closeBridge();
      } catch (err) {
        log.error("Error during CI environment teardown:", err);
      }
    }
    await super.teardown();
  }
}
