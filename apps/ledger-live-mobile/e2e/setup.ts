/* eslint-disable no-var */
import { device } from "detox";
import { getLogs, close as closeBridge } from "./bridge/server";
import { launchApp, setupEnvironment } from "./helpers/commonHelpers";
import { Step } from "jest-allure2-reporter/api";
import { ServerData } from "./bridge/types";
import { Subject } from "rxjs";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { ElementHelpers } from "./helpers/elementHelpers";
import expect from "expect";
import { Application } from "./page";

Object.defineProperty(globalThis, "Step", {
  value: Step,
  writable: true,
  configurable: true,
  enumerable: true,
});

type StepType = typeof Step;
type expectType = typeof expect;
type CurrencyType = typeof Currency;
type DelegateType = typeof Delegate;
type AccountType = typeof Account;
type TransactionType = typeof Transaction;
type FeeType = typeof Fee;
type AppInfosType = typeof AppInfos;
type SwapType = typeof Swap;

declare global {
  var IS_FAILED: boolean;
  var app: Application;
  var Step: StepType;
  var jestExpect: expectType;
  var Currency: CurrencyType;
  var Delegate: DelegateType;
  var Account: AccountType;
  var Transaction: TransactionType;
  var Fee: FeeType;
  var AppInfos: AppInfosType;
  var Swap: SwapType;

  var waitForElementById: typeof ElementHelpers.waitForElementById;
  var waitForElementByText: typeof ElementHelpers.waitForElementByText;
  var getElementById: typeof ElementHelpers.getElementById;
  var getElementsById: typeof ElementHelpers.getElementsById;
  var getElementByText: typeof ElementHelpers.getElementByText;
  var getWebElementById: typeof ElementHelpers.getWebElementById;
  var getWebElementByTag: typeof ElementHelpers.getWebElementByTag;
  var IsIdVisible: typeof ElementHelpers.IsIdVisible;
  var tapById: typeof ElementHelpers.tapById;
  var tapByText: typeof ElementHelpers.tapByText;
  var tapByElement: typeof ElementHelpers.tapByElement;
  var typeTextById: typeof ElementHelpers.typeTextById;
  var typeTextByElement: typeof ElementHelpers.typeTextByElement;
  var clearTextByElement: typeof ElementHelpers.clearTextByElement;
  var performScroll: typeof ElementHelpers.performScroll;
  var scrollToText: typeof ElementHelpers.scrollToText;
  var scrollToId: typeof ElementHelpers.scrollToId;
  var getTextOfElement: typeof ElementHelpers.getTextOfElement;
  var getIdByRegexp: typeof ElementHelpers.getIdByRegexp;
  var getIdOfElement: typeof ElementHelpers.getIdOfElement;
  var getWebElementByTestId: typeof ElementHelpers.getWebElementByTestId;
  var getWebElementsByIdAndText: typeof ElementHelpers.getWebElementsByIdAndText;
  var getWebElementText: typeof ElementHelpers.getWebElementText;
  var getWebElementValue: typeof ElementHelpers.getWebElementValue;
  var waitWebElementByTestId: typeof ElementHelpers.waitWebElementByTestId;
  var tapWebElementByTestId: typeof ElementHelpers.tapWebElementByTestId;
  var typeTextByWebTestId: typeof ElementHelpers.typeTextByWebTestId;
}

setupEnvironment();

global.IS_FAILED = false;
global.app = new Application();
global.webSocket = {
  wss: undefined,
  ws: undefined,
  messages: {},
  e2eBridgeServer: new Subject<ServerData>(),
};
global.jestExpect = expect;
global.Currency = Currency;
global.Delegate = Delegate;
global.Account = Account;
global.Transaction = Transaction;
global.Fee = Fee;
global.AppInfos = AppInfos;
global.Swap = Swap;

global.waitForElementById = ElementHelpers.waitForElementById;
global.waitForElementByText = ElementHelpers.waitForElementByText;
global.getElementById = ElementHelpers.getElementById;
global.getElementsById = ElementHelpers.getElementsById;
global.getElementByText = ElementHelpers.getElementByText;
global.getWebElementById = ElementHelpers.getWebElementById;
global.getWebElementByTag = ElementHelpers.getWebElementByTag;
global.IsIdVisible = ElementHelpers.IsIdVisible;
global.tapById = ElementHelpers.tapById;
global.tapByText = ElementHelpers.tapByText;
global.tapByElement = ElementHelpers.tapByElement;
global.typeTextById = ElementHelpers.typeTextById;
global.typeTextByElement = ElementHelpers.typeTextByElement;
global.clearTextByElement = ElementHelpers.clearTextByElement;
global.performScroll = ElementHelpers.performScroll;
global.scrollToText = ElementHelpers.scrollToText;
global.scrollToId = ElementHelpers.scrollToId;
global.getTextOfElement = ElementHelpers.getTextOfElement;
global.getIdByRegexp = ElementHelpers.getIdByRegexp;
global.getIdOfElement = ElementHelpers.getIdOfElement;
global.getWebElementByTestId = ElementHelpers.getWebElementByTestId;
global.getWebElementsByIdAndText = ElementHelpers.getWebElementsByIdAndText;
global.getWebElementText = ElementHelpers.getWebElementText;
global.getWebElementValue = ElementHelpers.getWebElementValue;
global.waitWebElementByTestId = ElementHelpers.waitWebElementByTestId;
global.tapWebElementByTestId = ElementHelpers.tapWebElementByTestId;
global.typeTextByWebTestId = ElementHelpers.typeTextByWebTestId;

beforeAll(
  async () => {
    const port = await launchApp();
    await device.reverseTcpPort(8081);
    await device.reverseTcpPort(port);
    await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app
    const testFileName = expect.getState().testPath?.replace(/^.*\/(.+?)(?:\.spec)?\.[^.]+$/, "$1");
    allure.description("Test file : " + testFileName);
  },
  process.env.CI ? 150000 : 300000,
);

afterAll(async () => {
  if (IS_FAILED && process.env.CI) {
    await allure.attachment("App logs", await getLogs(), "application/json");
  }
  closeBridge();
});
