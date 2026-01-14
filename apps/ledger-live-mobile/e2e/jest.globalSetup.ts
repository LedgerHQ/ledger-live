/* eslint-disable no-var */
import { globalSetup } from "detox/runners/jest";
import { Step } from "jest-allure2-reporter/api";
import { ServerData, MessageData } from "./bridge/types";
import { Subject } from "rxjs";
import WebSocket from "ws";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";

import { ElementHelpers } from "./helpers/elementHelpers";
import expect from "expect";

Object.defineProperty(globalThis, "Step", {
  value: Step,
  writable: true,
  configurable: true,
  enumerable: true,
});

import { Application } from "./page";

type StepType = typeof Step;
type expectType = typeof expect;
type CurrencyType = typeof Currency;
type DelegateType = typeof Delegate;
type AccountType = typeof Account;
type TransactionType = typeof Transaction;
type FeeType = typeof Fee;
type AppInfosType = typeof AppInfos;
type SwapType = typeof Swap;

interface GlobalExtensions {
  IS_FAILED: boolean;
  app: Application;
  webSocket: {
    wss: WebSocket.Server | undefined;
    ws: WebSocket | undefined;
    messages: { [id: string]: MessageData };
    e2eBridgeServer: Subject<ServerData>;
  };
  Step: StepType;
  jestExpect: expectType;
  Currency: CurrencyType;
  Delegate: DelegateType;
  Account: AccountType;
  Transaction: TransactionType;
  Fee: FeeType;
  AppInfos: AppInfosType;
  Swap: SwapType;
  waitForElementById: typeof ElementHelpers.waitForElementById;
  waitForElementByText: typeof ElementHelpers.waitForElementByText;
  getElementById: typeof ElementHelpers.getElementById;
  getElementsById: typeof ElementHelpers.getElementsById;
  getElementByText: typeof ElementHelpers.getElementByText;
  getWebElementById: typeof ElementHelpers.getWebElementById;
  getWebElementByTag: typeof ElementHelpers.getWebElementByTag;
  IsIdVisible: typeof ElementHelpers.IsIdVisible;
  tapById: typeof ElementHelpers.tapById;
  tapByText: typeof ElementHelpers.tapByText;
  tapByElement: typeof ElementHelpers.tapByElement;
  typeTextById: typeof ElementHelpers.typeTextById;
  typeTextByElement: typeof ElementHelpers.typeTextByElement;
  clearTextByElement: typeof ElementHelpers.clearTextByElement;
  performScroll: typeof ElementHelpers.performScroll;
  scrollToText: typeof ElementHelpers.scrollToText;
  scrollToId: typeof ElementHelpers.scrollToId;
  getTextOfElement: typeof ElementHelpers.getTextOfElement;
  getIdByRegexp: typeof ElementHelpers.getIdByRegexp;
  getIdOfElement: typeof ElementHelpers.getIdOfElement;
  getWebElementByTestId: typeof ElementHelpers.getWebElementByTestId;
  getWebElementsByIdAndText: typeof ElementHelpers.getWebElementsByIdAndText;
  getWebElementText: typeof ElementHelpers.getWebElementText;
  getWebElementValue: typeof ElementHelpers.getWebElementValue;
  waitWebElementByTestId: typeof ElementHelpers.waitWebElementByTestId;
  tapWebElementByTestId: typeof ElementHelpers.tapWebElementByTestId;
  typeTextByWebTestId: typeof ElementHelpers.typeTextByWebTestId;
}

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

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const g = globalThis as unknown as GlobalExtensions & typeof globalThis;

export default async () => {
  await globalSetup();
  g.IS_FAILED = false;

  g.app = new Application();
  g.webSocket = {
    wss: undefined,
    ws: undefined,
    messages: {},
    e2eBridgeServer: new Subject<ServerData>(),
  };
  g.jestExpect = expect;
  g.Currency = Currency;
  g.Delegate = Delegate;
  g.Account = Account;
  g.Transaction = Transaction;
  g.Fee = Fee;
  g.AppInfos = AppInfos;
  g.Swap = Swap;

  g.waitForElementById = ElementHelpers.waitForElementById;
  g.waitForElementByText = ElementHelpers.waitForElementByText;
  g.getElementById = ElementHelpers.getElementById;
  g.getElementsById = ElementHelpers.getElementsById;
  g.getElementByText = ElementHelpers.getElementByText;
  g.getWebElementById = ElementHelpers.getWebElementById;
  g.getWebElementByTag = ElementHelpers.getWebElementByTag;
  g.IsIdVisible = ElementHelpers.IsIdVisible;
  g.tapById = ElementHelpers.tapById;
  g.tapByText = ElementHelpers.tapByText;
  g.tapByElement = ElementHelpers.tapByElement;
  g.typeTextById = ElementHelpers.typeTextById;
  g.typeTextByElement = ElementHelpers.typeTextByElement;
  g.clearTextByElement = ElementHelpers.clearTextByElement;
  g.performScroll = ElementHelpers.performScroll;
  g.scrollToText = ElementHelpers.scrollToText;
  g.scrollToId = ElementHelpers.scrollToId;
  g.getTextOfElement = ElementHelpers.getTextOfElement;
  g.getIdByRegexp = ElementHelpers.getIdByRegexp;
  g.getIdOfElement = ElementHelpers.getIdOfElement;
  g.getWebElementByTestId = ElementHelpers.getWebElementByTestId;
  g.getWebElementsByIdAndText = ElementHelpers.getWebElementsByIdAndText;
  g.getWebElementText = ElementHelpers.getWebElementText;
  g.getWebElementValue = ElementHelpers.getWebElementValue;
  g.waitWebElementByTestId = ElementHelpers.waitWebElementByTestId;
  g.tapWebElementByTestId = ElementHelpers.tapWebElementByTestId;
  g.typeTextByWebTestId = ElementHelpers.typeTextByWebTestId;
};
