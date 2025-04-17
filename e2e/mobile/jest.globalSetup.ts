import "tsconfig-paths/register";
import { globalSetup } from "detox/runners/jest";
import { Subject, Subscription } from "rxjs";
import { $TmsLink, Step } from "jest-allure2-reporter/api";
import { ServerData } from "./bridge/types";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { CLI } from "./utils/cliUtils";
import expect from "expect";
import fs from "fs";
import path from "path";
import { NativeElementHelpers, WebElementHelpers } from "./helpers/elementHelpers";

global.Step = Step;
global.$TmsLink = $TmsLink;

// Import Application after Step globals to avoid premature loading
import { Application } from "./page";
import { log } from "detox";

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
  global.speculosDevices = new Map<number, string>();
  global.proxySubscriptions = new Map<number, { port: number; subscription: Subscription }>();

  global.app = new Application();
  global.webSocket = {
    wss: undefined,
    ws: undefined,
    messages: {},
    e2eBridgeServer: new Subject<ServerData>(),
  };

  // Assign utilities and enums
  global.CLI = CLI;
  global.jestExpect = expect;
  // global.detoxExpect = detoxExpect;
  global.Currency = Currency;
  global.Delegate = Delegate;
  global.Account = Account;
  global.Transaction = Transaction;
  global.Fee = Fee;
  global.AppInfos = AppInfos;
  global.Swap = Swap;

  // Bind native helpers
  global.waitForElementById = NativeElementHelpers.waitForElementById;
  global.waitForElementByText = NativeElementHelpers.waitForElementByText;
  global.waitForElementNotVisible = NativeElementHelpers.waitForElementNotVisible;
  global.getElementById = NativeElementHelpers.getElementById;
  global.getElementsById = NativeElementHelpers.getElementsById;
  global.getElementByText = NativeElementHelpers.getElementByText;
  global.IsIdVisible = NativeElementHelpers.isIdVisible;
  global.tapById = NativeElementHelpers.tapById;
  global.tapByText = NativeElementHelpers.tapByText;
  global.tapByElement = NativeElementHelpers.tapByElement;
  global.typeTextById = NativeElementHelpers.typeTextById;
  global.typeTextByElement = NativeElementHelpers.typeTextByElement;
  global.clearTextByElement = NativeElementHelpers.clearTextByElement;
  global.performScroll = NativeElementHelpers.performScroll;
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
  global.getWebElementsText = WebElementHelpers.getWebElementsText;
  global.waitWebElementByTestId = WebElementHelpers.waitWebElementByTestId;
  global.tapWebElementByTestId = WebElementHelpers.tapWebElementByTestId;
  global.typeTextByWebTestId = WebElementHelpers.typeTextByWebTestId;
}
