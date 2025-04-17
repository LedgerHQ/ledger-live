// types/global.d.ts
import type { Subject, Subscription } from "rxjs";
import type { Server, WebSocket } from "ws";
import type { Application } from "../page";
import type { MessageData, ServerData } from "../bridge/types";
import type expect from "expect";
import type { $TmsLink as $TmsLinkType, Step as StepType } from "jest-allure2-reporter/api";
import { NativeElementHelpers, WebElementHelpers } from "../helpers/elementHelpers";
import { Currency as CurrencyType } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Delegate as DelegateType } from "@ledgerhq/live-common/e2e/models/Delegate";
import { Account as AccountType } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction as TransactionType } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Fee as FeeType } from "@ledgerhq/live-common/e2e/enum/Fee";
import { AppInfos as AppInfosType } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { Swap as SwapType } from "@ledgerhq/live-common/e2e/models/Swap";
import { CLI as CLIType } from "./utils/cliUtils";

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
  var Step: typeof StepType;
  var $TmsLink: typeof $TmsLinkType;
  var CLI: typeof CLIType;
  var jestExpect: typeof expect;
  var Currency: typeof CurrencyType;
  var Delegate: typeof DelegateType;
  var Account: typeof AccountType;
  var Transaction: typeof TransactionType;
  var Fee: typeof FeeType;
  var AppInfos: typeof AppInfosType;
  var Swap: typeof SwapType;

  var waitForElementById: typeof NativeElementHelpers.waitForElementById;
  var waitForElementByText: typeof NativeElementHelpers.waitForElementByText;
  var waitForElementNotVisible: typeof NativeElementHelpers.waitForElementNotVisible;
  var getElementById: typeof NativeElementHelpers.getElementById;
  var getElementsById: typeof NativeElementHelpers.getElementsById;
  var getElementByText: typeof NativeElementHelpers.getElementByText;
  var IsIdVisible: typeof NativeElementHelpers.isIdVisible;
  var tapById: typeof NativeElementHelpers.tapById;
  var tapByText: typeof NativeElementHelpers.tapByText;
  var tapByElement: typeof NativeElementHelpers.tapByElement;
  var typeTextById: typeof NativeElementHelpers.typeTextById;
  var typeTextByElement: typeof NativeElementHelpers.typeTextByElement;
  var clearTextByElement: typeof NativeElementHelpers.clearTextByElement;
  var performScroll: typeof NativeElementHelpers.performScroll;
  var scrollToText: typeof NativeElementHelpers.scrollToText;
  var scrollToId: typeof NativeElementHelpers.scrollToId;
  var getTextOfElement: typeof NativeElementHelpers.getTextOfElement;
  var getIdByRegexp: typeof NativeElementHelpers.getIdByRegexp;
  var getIdOfElement: typeof NativeElementHelpers.getIdOfElement;

  var getWebElementById: typeof WebElementHelpers.getWebElementById;
  var getWebElementByTag: typeof WebElementHelpers.getWebElementByTag;
  var getWebElementByTestId: typeof WebElementHelpers.getWebElementByTestId;
  var getWebElementText: typeof WebElementHelpers.getWebElementText;
  var getWebElementsByIdAndText: typeof WebElementHelpers.getWebElementsByIdAndText;
  var getWebElementsText: typeof WebElementHelpers.getWebElementsText;
  var waitWebElementByTestId: typeof WebElementHelpers.waitWebElementByTestId;
  var tapWebElementByTestId: typeof WebElementHelpers.tapWebElementByTestId;
  var typeTextByWebTestId: typeof WebElementHelpers.typeTextByWebTestId;
}
