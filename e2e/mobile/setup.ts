import { device } from "detox";
import { closeProxy } from "./bridge/proxy";
import { close as closeBridge, getLogs } from "./bridge/server";
import { launchApp, setupEnvironment } from "./helpers/commonHelpers";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { $Tag, $TmsLink, allure, Step } from "jest-allure2-reporter/api";
import expect from "expect";
import { NativeElementHelpers, WebElementHelpers } from "./helpers/elementHelpers";

import { Subject, Subscription } from "rxjs";
import { ServerData } from "../../apps/ledger-live-mobile/e2e/bridge/types";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { CLI } from "./utils/cliUtils";

global.Step = Step;
global.$TmsLink = $TmsLink;
global.$Tag = $Tag;

import { Application } from "./page";

global.IS_FAILED = false;
global.speculosDevices = new Map<string, number>();
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
global.TokenAccount = TokenAccount;
global.Transaction = Transaction;
global.Fee = Fee;
global.AppInfos = AppInfos;
global.Swap = Swap;

// Bind native helpers
global.detoxExpect = NativeElementHelpers.expect;
global.waitForElementById = NativeElementHelpers.waitForElementById;
global.waitForElementByText = NativeElementHelpers.waitForElementByText;
global.waitForElementNotVisible = NativeElementHelpers.waitForElementNotVisible;
global.getElementById = NativeElementHelpers.getElementById;
global.getElementsById = NativeElementHelpers.getElementsById;
global.getElementByText = NativeElementHelpers.getElementByText;
global.getElementByIdAndText = NativeElementHelpers.getElementByIdAndText;
global.countElementsById = NativeElementHelpers.countElementsById;
global.IsIdVisible = NativeElementHelpers.isIdVisible;
global.tapById = NativeElementHelpers.tapById;
global.tapByText = NativeElementHelpers.tapByText;
global.tapByElement = NativeElementHelpers.tapByElement;
global.typeTextById = NativeElementHelpers.typeTextById;
global.typeTextByElement = NativeElementHelpers.typeTextByElement;
global.clearTextByElement = NativeElementHelpers.clearTextByElement;
global.scrollToText = NativeElementHelpers.scrollToText;
global.scrollToId = NativeElementHelpers.scrollToId;
global.getTextOfElement = NativeElementHelpers.getTextOfElement;
global.getIdByRegexp = NativeElementHelpers.getIdByRegexp;
global.getIdOfElement = NativeElementHelpers.getIdOfElement;

// Bind web helpers
global.getWebElementById = WebElementHelpers.getWebElementById;
global.getWebElementByTag = WebElementHelpers.getWebElementByTag;
global.getWebElementByTestId = WebElementHelpers.getWebElementByTestId;
global.getWebElementText = WebElementHelpers.getWebElementText;
global.getWebElementsByIdAndText = WebElementHelpers.getWebElementsByIdAndText;
global.getWebElementsByCssSelector = WebElementHelpers.getWebElementsByCssSelector;
global.getWebElementsText = WebElementHelpers.getWebElementsText;
global.waitWebElementByTestId = WebElementHelpers.waitWebElementByTestId;
global.tapWebElementByTestId = WebElementHelpers.tapWebElementByTestId;
global.typeTextByWebTestId = WebElementHelpers.typeTextByWebTestId;
global.getValueByWebTestId = WebElementHelpers.getValueByWebTestId;
global.tapWebElementByElement = WebElementHelpers.tapWebElementByElement;

const broadcastOriginalValue = getEnv("DISABLE_TRANSACTION_BROADCAST");
setupEnvironment();

beforeAll(async () => {
  const port = await launchApp();
  await device.reverseTcpPort(8081);
  await device.reverseTcpPort(port);
  await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app
  const testFileName = expect.getState().testPath?.replace(/^.*\/(.+?)(?:\.spec)?\.[^.]+$/, "$1");
  allure.description("Test file : " + testFileName);
}, 150_000);

afterAll(async () => {
  if (IS_FAILED && process.env.CI) {
    await allure.attachment("App logs", await getLogs(), "application/json");
  }
  setEnv("DISABLE_TRANSACTION_BROADCAST", broadcastOriginalValue);
  closeBridge();
  closeProxy();
  await app.common.removeSpeculos();
});
