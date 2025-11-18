import "tsconfig-paths/register";
import { globalSetup } from "detox/runners/jest";
import { Subject, Subscription } from "rxjs";
import { $TmsLink, Step, $Tag, allure } from "jest-allure2-reporter/api";
import { ServerData } from "../../apps/ledger-live-mobile/e2e/bridge/types";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { CLI } from "./utils/cliUtils";
import expect from "expect";
import fs from "fs";
import path from "path";
import { NativeElementHelpers, WebElementHelpers } from "./helpers/elementHelpers";
import { log } from "detox";
import { Subscriber } from "rxjs";

global.Step = Step;
global.$TmsLink = $TmsLink;
global.$Tag = $Tag;

// Import Application after Step globals to avoid premature loading
import { Application } from "./page";

// Cleanup logic
async function cleanupSpeculos() {
  if (global.app?.common?.removeSpeculos) {
    await global.app.common.removeSpeculos();
    log.info("✅ Speculos cleanup completed.");
  }
}

// Handle graceful exits
process.once("SIGINT", async () => {
  log.info("🔴 SIGINT received. Cleaning up...");
  await cleanupSpeculos();
  process.exit(0);
});

process.once("SIGTERM", async () => {
  log.info("🔴 SIGTERM received. Cleaning up...");
  await cleanupSpeculos();
  process.exit(0);
});

process.once("exit", async () => {
  log.info("⚠️ Process exit. Running cleanup...");
  await cleanupSpeculos();
});

process.on("unhandledRejection", reason => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logSilentError(err);
});

process.on("uncaughtException", err => {
  logSilentError(err);
});

Subscriber.prototype.error = function (err: Error) {
  logSilentError(err);
};

function logSilentError(err: Error) {
  const errorMessage = `❌ Exception occurred during test → ${err.message}`;
  log.error(errorMessage);
  try {
    allure.description(errorMessage);
    allure.step(err.message, () => {
      allure.status("failed", { message: err.message, trace: err.stack });
    });
  } catch (reportErr) {
    log.error(
      "Failed to report silent error to Allure. ",
      "Original error:",
      err,
      "Reporting error:",
      reportErr,
    );
  }
}

export default async function setup(): Promise<void> {
  // Validate .env.mock file
  const envFileName = process.env.ENV_FILE || ".env.mock";
  const envFile = path.join(__dirname, "../../apps/ledger-live-mobile", envFileName);
  try {
    fs.accessSync(envFile, fs.constants.R_OK);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Mock env file not found or not readable: ${envFile} (${errorMessage})`);
  }

  // Run Detox global setup
  await globalSetup();

  // Initialize global state
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
  global.pendingCallbacks = new Map<string, { callback: (data: string) => void }>();

  // Assign utilities and enums
  global.Account = Account;
  global.AppInfos = AppInfos;
  global.CLI = CLI;
  global.Currency = Currency;
  global.Delegate = Delegate;
  global.Fee = Fee;
  global.jestExpect = expect;
  global.Swap = Swap;
  global.TokenAccount = TokenAccount;
  global.Transaction = Transaction;

  // Bind native helpers
  global.clearTextByElement = NativeElementHelpers.clearTextByElement;
  global.countElementsById = NativeElementHelpers.countElementsById;
  global.detoxExpect = NativeElementHelpers.expect;
  global.getAttributesOfElement = NativeElementHelpers.getAttributesOfElement;
  global.getElementById = NativeElementHelpers.getElementById;
  global.getElementByIdAndText = NativeElementHelpers.getElementByIdAndText;
  global.getElementByText = NativeElementHelpers.getElementByText;
  global.getElementsById = NativeElementHelpers.getElementsById;
  global.getIdByRegexp = NativeElementHelpers.getIdByRegexp;
  global.getIdOfElement = NativeElementHelpers.getIdOfElement;
  global.getTextOfElement = NativeElementHelpers.getTextOfElement;
  global.IsIdVisible = NativeElementHelpers.isIdVisible;
  global.scrollToId = NativeElementHelpers.scrollToId;
  global.scrollToText = NativeElementHelpers.scrollToText;
  global.tapByElement = NativeElementHelpers.tapByElement;
  global.tapById = NativeElementHelpers.tapById;
  global.tapByText = NativeElementHelpers.tapByText;
  global.typeTextByElement = NativeElementHelpers.typeTextByElement;
  global.typeTextById = NativeElementHelpers.typeTextById;
  global.waitForElement = NativeElementHelpers.waitForElement;
  global.waitForElementById = NativeElementHelpers.waitForElementById;
  global.waitForElementByText = NativeElementHelpers.waitForElementByText;
  global.waitForElementNotVisible = NativeElementHelpers.waitForElementNotVisible;

  // Bind web helpers
  global.getCurrentWebviewUrl = WebElementHelpers.getCurrentWebviewUrl;
  global.getValueByWebTestId = WebElementHelpers.getValueByWebTestId;
  global.getWebElementByCssSelector = WebElementHelpers.getWebElementByCssSelector;
  global.getWebElementById = WebElementHelpers.getWebElementById;
  global.getWebElementByTag = WebElementHelpers.getWebElementByTag;
  global.getWebElementByTestId = WebElementHelpers.getWebElementByTestId;
  global.getWebElementsByCssSelector = WebElementHelpers.getWebElementsByCssSelector;
  global.getWebElementsByIdAndText = WebElementHelpers.getWebElementsByIdAndText;
  global.getWebElementsText = WebElementHelpers.getWebElementsText;
  global.getWebElementText = WebElementHelpers.getWebElementText;
  global.scrollToWebElement = WebElementHelpers.scrollToWebElement;
  global.tapWebElementByElement = WebElementHelpers.tapWebElementByElement;
  global.tapWebElementByTestId = WebElementHelpers.tapWebElementByTestId;
  global.typeTextByWebTestId = WebElementHelpers.typeTextByWebTestId;
  global.waitForWebElementToBeEnabled = WebElementHelpers.waitForWebElementToBeEnabled;
  global.waitWebElementByTestId = WebElementHelpers.waitWebElementByTestId;
}
