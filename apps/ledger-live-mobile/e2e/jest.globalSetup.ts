/* eslint-disable no-var */
import { globalSetup } from "detox/runners/jest";
import { Subscription } from "rxjs";
import { Subject } from "rxjs";
import { ServerData } from "./bridge/types";
import { Server, WebSocket } from "ws";
import { Step } from "jest-allure2-reporter/api";
//import { device, element, by, waitFor, web, expect as detoxExpect, log } from "detox";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";

import { ElementHelper } from "./elementHelper";
import { CLI } from "./utils/cliUtils";
import expect from "expect";

//if (!globalThis.Step) {
Object.defineProperty(globalThis, "Step", {
  value: Step,
  writable: true,
  configurable: true,
  enumerable: true,
});
//}
import { Application } from "./page";

type StepType = typeof Step;
type CLIType = typeof CLI;
type expectType = typeof expect;
type CurrencyType = typeof Currency;
type DelegateType = typeof Delegate;
type AccountType = typeof Account;
type TransactionType = typeof Transaction;

//import { setupEnvironment } from "./globalHelpers";
//import detox from "detox";

declare global {
  var IS_FAILED: boolean;
  var speculosDevices: Map<number, string>;
  var proxySubscriptions: Map<number, { port: number; subscription: Subscription }>;
  //var e2eBridgeServer: Subject<ServerData>;
  var webSocket: { wss: Server | undefined; ws: WebSocket | undefined };
  var app: Application;
  var Step: StepType;
  var CLI: CLIType;

  var waitForElementById: typeof ElementHelper.waitForElementById;
  var waitForElementByText: typeof ElementHelper.waitForElementByText;
  var getElementById: typeof ElementHelper.getElementById;
  var getElementByText: typeof ElementHelper.getElementByText;
  var getWebElementById: typeof ElementHelper.getWebElementById;
  var getWebElementByTag: typeof ElementHelper.getWebElementByTag;
  var getWebElementByTestId: typeof ElementHelper.getWebElementByTestId;
  var getWebElementsWithText: typeof ElementHelper.getWebElementsWithText;
  var getWebElementsText: typeof ElementHelper.getWebElementsText;
  var waitWebElementByTestId: typeof ElementHelper.waitWebElementByTestId;
  var tapWebElementByTestId: typeof ElementHelper.tapWebElementByTestId;
  var typeTextByWebTestId: typeof ElementHelper.typeTextByWebTestId;
  var IsIdVisible: typeof ElementHelper.IsIdVisible;
  var tapById: typeof ElementHelper.tapById;
  var tapByText: typeof ElementHelper.tapByText;
  var tapByElement: typeof ElementHelper.tapByElement;
  var typeTextById: typeof ElementHelper.typeTextById;
  var typeTextByElement: typeof ElementHelper.typeTextByElement;
  var clearTextByElement: typeof ElementHelper.clearTextByElement;
  var performScroll: typeof ElementHelper.performScroll;
  var scrollToText: typeof ElementHelper.scrollToText;
  var scrollToId: typeof ElementHelper.scrollToId;
  var getTextOfElement: typeof ElementHelper.getTextOfElement;
  var getIdOfElement: typeof ElementHelper.getIdOfElement;
  /*var detoxExpect: Detox.DetoxExportWrapper["expect"];
  var log: Detox.DetoxExportWrapper["log"];
  var detoxDevice: Detox.DetoxExportWrapper["device"];
  var detoxWaitFor: Detox.DetoxExportWrapper["waitFor"];
  var detoxBy: Detox.DetoxExportWrapper["by"];
  var detoxWeb: Detox.DetoxExportWrapper["web"];
  var detoxElement: Detox.DetoxExportWrapper["element"];*/
  var jestExpect: expectType;
  var Currency: CurrencyType;
  var Delegate: DelegateType;
  var Account: AccountType;
  var Transaction: TransactionType;
}

export default async () => {
  await globalSetup();
  global.IS_FAILED = false;
  global.speculosDevices = new Map<number, string>();
  global.proxySubscriptions = new Map<number, { port: number; subscription: Subscription }>();
  //global.e2eBridgeServer = new Subject<ServerData>();
  //setupEnvironment();
  global.app = new Application();
  global.webSocket = { wss: undefined, ws: undefined };
  global.CLI = CLI;
  global.jestExpect = expect;
  global.Currency = Currency;
  global.Delegate = Delegate;
  global.Account = Account;
  global.Transaction = Transaction;
  /* global.detoxDevice = device;
  global.detoxBy = by;
  global.detoxWeb = web;
  global.detoxElement = element;
  global.detoxExpect = detoxExpect;
  global.log = log;
  global.detoxWaitFor = waitFor;*/

  global.waitForElementById = ElementHelper.waitForElementById;
  global.waitForElementByText = ElementHelper.waitForElementByText;
  global.getElementById = ElementHelper.getElementById;
  global.getElementByText = ElementHelper.getElementByText;
  global.getWebElementById = ElementHelper.getWebElementById;
  global.getWebElementByTag = ElementHelper.getWebElementByTag;
  global.getWebElementByTestId = ElementHelper.getWebElementByTestId;
  global.getWebElementsWithText = ElementHelper.getWebElementsWithText;
  global.getWebElementsText = ElementHelper.getWebElementsText;
  global.waitWebElementByTestId = ElementHelper.waitWebElementByTestId;
  global.tapWebElementByTestId = ElementHelper.tapWebElementByTestId;
  global.typeTextByWebTestId = ElementHelper.typeTextByWebTestId;
  global.IsIdVisible = ElementHelper.IsIdVisible;
  global.tapById = ElementHelper.tapById;
  global.tapByText = ElementHelper.tapByText;
  global.tapByElement = ElementHelper.tapByElement;
  global.typeTextById = ElementHelper.typeTextById;
  global.typeTextByElement = ElementHelper.typeTextByElement;
  global.clearTextByElement = ElementHelper.clearTextByElement;
  global.performScroll = ElementHelper.performScroll;
  global.scrollToText = ElementHelper.scrollToText;
  global.scrollToId = ElementHelper.scrollToId;
  global.getTextOfElement = ElementHelper.getTextOfElement;
  global.getIdOfElement = ElementHelper.getIdOfElement;
  /*global.detoxExpect = detox.expect;
  global.log = detox.log;
  global.detoxDevice = detox.device;
  global.detoxWaitFor = detox.waitFor;
  global.detoxBy = detox.by;
  global.detoxWeb = detox.web;
  global.detoxElement = detox.element;*/
};
