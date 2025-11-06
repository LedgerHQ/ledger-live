/* eslint-disable @typescript-eslint/triple-slash-reference */
/* eslint-disable no-var */
/// <reference path=".//global.d.ts" />
import type { Subject, Subscription } from "rxjs";
import type { Server, WebSocket } from "ws";
import type { Application } from "../page";
import type { MessageData, ServerData } from "../bridge/types";
import type expect from "expect";
import type {
  $TmsLink as $TmsLinkType,
  Step as StepType,
  $Tag as $TagType,
} from "jest-allure2-reporter/api";
import { NativeElementHelpers, WebElementHelpers } from "../helpers/elementHelpers";
import { Currency as CurrencyType } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Delegate as DelegateType } from "@ledgerhq/live-common/e2e/models/Delegate";
import {
  Account as AccountType,
  TokenAccount as TokenAccountType,
} from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction as TransactionType } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Fee as FeeType } from "@ledgerhq/live-common/e2e/enum/Fee";
import { AppInfos as AppInfosType } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { Swap as SwapType } from "@ledgerhq/live-common/e2e/models/Swap";
import { CLI as CLIType } from "../utils/cliUtils";

declare global {
  var IS_FAILED: boolean;
  var speculosDevices: Map<string, number>;
  var proxySubscriptions: Map<number, { port: number; subscription: Subscription }>;
  var webSocket: {
    wss: Server | undefined;
    ws: WebSocket | undefined;
    messages: { [id: string]: MessageData };
    e2eBridgeServer: Subject<ServerData>;
  };

  var pendingCallbacks: Map<string, { callback: (data: string) => void }>;

  var app: Application;
  var Step: typeof StepType;
  var $TmsLink: typeof $TmsLinkType;
  var $Tag: typeof $TagType;
  var CLI: typeof CLIType;
  var jestExpect: typeof expect;
  var Currency: typeof CurrencyType;
  var Delegate: typeof DelegateType;
  var Account: typeof AccountType;
  var TokenAccount: typeof TokenAccountType;
  var Transaction: typeof TransactionType;
  var Fee: typeof FeeType;
  var AppInfos: typeof AppInfosType;
  var Swap: typeof SwapType;

  var clearTextByElement: typeof NativeElementHelpers.clearTextByElement;
  var countElementsById: typeof NativeElementHelpers.countElementsById;
  var detoxExpect: typeof NativeElementHelpers.expect;
  var getElementById: typeof NativeElementHelpers.getElementById;
  var getElementByIdAndText: typeof NativeElementHelpers.getElementByIdAndText;
  var getElementByText: typeof NativeElementHelpers.getElementByText;
  var getElementsById: typeof NativeElementHelpers.getElementsById;
  var getIdByRegexp: typeof NativeElementHelpers.getIdByRegexp;
  var getIdOfElement: typeof NativeElementHelpers.getIdOfElement;
  var getTextOfElement: typeof NativeElementHelpers.getTextOfElement;
  var IsIdVisible: typeof NativeElementHelpers.isIdVisible;
  var IsTextVisible: typeof NativeElementHelpers.isTextVisible;
  var scrollToId: typeof NativeElementHelpers.scrollToId;
  var scrollToText: typeof NativeElementHelpers.scrollToText;
  var tapByElement: typeof NativeElementHelpers.tapByElement;
  var tapById: typeof NativeElementHelpers.tapById;
  var tapByText: typeof NativeElementHelpers.tapByText;
  var typeTextByElement: typeof NativeElementHelpers.typeTextByElement;
  var typeTextById: typeof NativeElementHelpers.typeTextById;
  var waitForElement: typeof NativeElementHelpers.waitForElement;
  var waitForElementById: typeof NativeElementHelpers.waitForElementById;
  var waitForElementByText: typeof NativeElementHelpers.waitForElementByText;
  var waitForElementNotVisible: typeof NativeElementHelpers.waitForElementNotVisible;

  var getCurrentWebviewUrl: typeof WebElementHelpers.getCurrentWebviewUrl;
  var getValueByWebTestId: typeof WebElementHelpers.getValueByWebTestId;
  var getWebElementByCssSelector: typeof WebElementHelpers.getWebElementByCssSelector;
  var getWebElementById: typeof WebElementHelpers.getWebElementById;
  var getWebElementByTag: typeof WebElementHelpers.getWebElementByTag;
  var getWebElementByTestId: typeof WebElementHelpers.getWebElementByTestId;
  var getWebElementsByCssSelector: typeof WebElementHelpers.getWebElementsByCssSelector;
  var getWebElementsByIdAndText: typeof WebElementHelpers.getWebElementsByIdAndText;
  var getWebElementsText: typeof WebElementHelpers.getWebElementsText;
  var getWebElementText: typeof WebElementHelpers.getWebElementText;
  var scrollToWebElement: typeof WebElementHelpers.scrollToWebElement;
  var tapWebElementByElement: typeof WebElementHelpers.tapWebElementByElement;
  var tapWebElementByTestId: typeof WebElementHelpers.tapWebElementByTestId;
  var typeTextByWebTestId: typeof WebElementHelpers.typeTextByWebTestId;
  var waitForWebElementToBeEnabled: typeof WebElementHelpers.waitForWebElementToBeEnabled;
  var waitWebElementByTestId: typeof WebElementHelpers.waitWebElementByTestId;
}
