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

import { ElementHelpers } from "./helpers/elementHelpers";
import { CLI } from "./utils/cliUtils";
import expect from "expect";

Object.defineProperty(globalThis, "Step", {
  value: Step,
  writable: true,
  configurable: true,
  enumerable: true,
});

import { Application } from "./page";

type StepType = typeof Step;
type CLIType = typeof CLI;
type expectType = typeof expect;
type CurrencyType = typeof Currency;
type DelegateType = typeof Delegate;
type AccountType = typeof Account;
type TransactionType = typeof Transaction;
type FeeType = typeof Fee;
type AppInfosType = typeof AppInfos;

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

  var app: Application;
  var Step: StepType;
  var CLI: CLIType;
  var jestExpect: expectType;
  var Currency: CurrencyType;
  var Delegate: DelegateType;
  var Account: AccountType;
  var Transaction: TransactionType;
  var Fee: FeeType;
  var AppInfos: AppInfosType;

  var waitForElementById: typeof ElementHelpers.waitForElementById;
  var waitForElementByText: typeof ElementHelpers.waitForElementByText;
  var getElementById: typeof ElementHelpers.getElementById;
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
  var getIdOfElement: typeof ElementHelpers.getIdOfElement;
}

export default async () => {
  await globalSetup();
  global.IS_FAILED = false;
  global.speculosDevices = new Map<number, string>();
  global.proxySubscriptions = new Map<number, { port: number; subscription: Subscription }>();

  global.app = new Application();
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

  global.waitForElementById = ElementHelpers.waitForElementById;
  global.waitForElementByText = ElementHelpers.waitForElementByText;
  global.getElementById = ElementHelpers.getElementById;
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
  global.getIdOfElement = ElementHelpers.getIdOfElement;
};
