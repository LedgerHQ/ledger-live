/* eslint-disable no-var */
import { globalSetup } from "detox/runners/jest";
import { Subscription } from "rxjs";
import { Server, WebSocket } from "ws";
import { Step } from "jest-allure2-reporter/api";
import { MessageData, ServerData } from "./bridge/types";
import { Subject } from "rxjs";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";

import { ElementHelpers } from "./helpers/elementHelpers";
import { CLI } from "./utils/cliUtils";
import expect from "expect";

Object.defineProperty(globalThis, "Step", {
  value: Step,
  writable: true,
  configurable: true,
  enumerable: true,
});

// import { Application } from "./page";

type StepType = typeof Step;
type CLIType = typeof CLI;
type expectType = typeof expect;
type CurrencyType = typeof Currency;
type DelegateType = typeof Delegate;
type AccountType = typeof Account;
type TransactionType = typeof Transaction;
type FeeType = typeof Fee;
type AppInfosType = typeof AppInfos;
type SwapType = typeof Swap;

process.on("SIGINT", async () => {
  // if (global.app?.common?.removeSpeculos) {
  //   await global.app.common.removeSpeculos();
  // }
  process.exit(0);
});

declare global {
  var IS_FAILED: boolean;
  var speculosDevices: Map<number, string>;
  var proxySubscriptions: Map<number, { port: number; subscription: Subscription }>;
  var webSocket: {
    wss: Server | undefined;
    ws: WebSocket | undefined;
    messages: { [id: string]: MessageData };
    e2eBridgeServer: Subject<ServerData>;
  };

  // var app: Application;
  var Step: StepType;
  var CLI: CLIType;
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
  var getWebElementsText: typeof ElementHelpers.getWebElementsText;
  var waitWebElementByTestId: typeof ElementHelpers.waitWebElementByTestId;
  var tapWebElementByTestId: typeof ElementHelpers.tapWebElementByTestId;
  var typeTextByWebTestId: typeof ElementHelpers.typeTextByWebTestId;
}

export default async () => {
  await globalSetup();
  global.IS_FAILED = false;
  global.speculosDevices = new Map<number, string>();
  global.proxySubscriptions = new Map<number, { port: number; subscription: Subscription }>();

  // global.app = new Application();
  global.webSocket = {
    wss: undefined,
    ws: undefined,
    messages: {},
    e2eBridgeServer: new Subject<ServerData>(),
  };
  global.CLI = CLI;
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
  global.getWebElementsText = ElementHelpers.getWebElementsText;
  global.waitWebElementByTestId = ElementHelpers.waitWebElementByTestId;
  global.tapWebElementByTestId = ElementHelpers.tapWebElementByTestId;
  global.typeTextByWebTestId = ElementHelpers.typeTextByWebTestId;
};
