/**
 * ETH → ETH_USDT swap, end-to-end via Speculos.
 *
 * Mirrors `e2e/mobile/specs/swap/swapETH_ETH_USDT.spec.ts` (which calls
 * `runSwapTest(new Swap(Account.ETH_1, TokenAccount.ETH_USDT_1, ...))`)
 * with no page objects — drives the Swap Live App webview and Speculos
 * directly.
 *
 *   1. Configure the Exchange Speculos to bundle the Ethereum app.
 *   2. Boot the app device-ready (seeded ETH + USDT subaccount) with
 *      lwmWallet40 + llmModularDrawer + ptxSwapLiveAppMobile flags;
 *      swapSetup pins SWAP_API_BASE to staging.
 *   3. Open the swap deeplink, wait for the webview's from-account
 *      selector, fill the form, request quotes.
 *   4. Pick the first quote, tap Execute — the app sends a swap APDU
 *      stream to Speculos. Disable Detox sync from there.
 *   5. verifyAmountsAndAcceptSwap from live-common drives Speculos to
 *      review + sign.
 *
 * Pre-reqs (env): SEED, COINAPPS (local) or REMOTE_SPECULOS=true +
 * SPECULINHO_URL, SWAP_DISABLE_TRANSACTION_BROADCAST (implicit via the
 * swapSetup bridge call which forces broadcast off).
 */
import { device, element, by, expect, waitFor, web } from "detox";
import { launchApp, closeApp } from "../helpers/launchApp";
import { loadConfig } from "../helpers/loadConfig";
import { launchSpeculos, shutdownSpeculos, SpeculosHandle } from "../helpers/speculos";
import * as bridge from "../bridge/server";
import { setExchangeDependencies, verifyAmountsAndAcceptSwap } from "@ledgerhq/live-common/e2e/speculos";
import { getMinimumSwapAmount } from "@ledgerhq/live-common/e2e/swap";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const hasSpeculosEnv =
  !!process.env.SEED && (!!process.env.COINAPPS || process.env.REMOTE_SPECULOS === "true");

const maybeDescribe = hasSpeculosEnv ? describe : describe.skip;

/**
 * Match a web element by its data-testid attribute. The Swap Live App
 * renders React (not RN) so testIDs land as `data-testid="..."` in the
 * DOM — Detox's `by.web.id` matches `id=` instead, so we go via CSS.
 */
const webByTestId = (id: string) => web.element(by.web.cssSelector(`[data-testid="${id}"]`));

/**
 * Poll a webview element until it exists. Detox's `waitFor()` is
 * native-only; web elements only expose `expect().toExist()` so we
 * retry until timeout.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function pollWeb(el: any, timeoutMs: number, intervalMs = 500): Promise<void> {
  const start = Date.now();
  for (;;) {
    try {
      await expect(el).toExist();
      return;
    } catch (e) {
      if (Date.now() - start > timeoutMs) throw e;
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }
}

maybeDescribe("Swap — ETH → ETH_USDT via Speculos", () => {
  let handle: SpeculosHandle;
  const swap = new Swap(Account.ETH_1, TokenAccount.ETH_USDT_1, "0", undefined, Fee.MEDIUM);

  beforeAll(async () => {
    // Exchange app needs the Ethereum subapp for ETH + ETH-USDT (USDT
    // is an ERC20 handled by the Ethereum app).
    setExchangeDependencies([{ name: "Ethereum" }]);
    await launchApp();
    await loadConfig("device-ready");
    handle = await launchSpeculos("Exchange");
    await bridge.swapSetup();
  });

  afterAll(async () => {
    if (handle) await shutdownSpeculos(handle);
    closeApp();
  });

  it("ETH to ETH_USDT", async () => {
    // 1. Fetch the minimum swap amount the API will accept right now.
    const min = await getMinimumSwapAmount(Account.ETH_1, TokenAccount.ETH_USDT_1);
    if (!min) throw new Error("getMinimumSwapAmount returned null");
    swap.amount = String(min);

    // 2. Open the Swap Live App via deeplink.
    await device.openURL({ url: "ledgerlive://swap" });

    // 3. Wait for the webview form to settle. Detox's web API has no
    //    waitFor — poll `expect.toExist()` until the from selector is
    //    in the DOM, then start interacting.
    const wv = web;
    const fromSelector = webByTestId("from-account-coin-selector");
    await pollWeb(fromSelector, 30_000);

    // 4. From currency: tap selector, then search ETH in the modular
    //    drawer (native UI, not webview).
    await fromSelector.tap();
    await waitFor(element(by.id("modular-drawer-search-input")))
      .toBeVisible()
      .withTimeout(15_000);
    await element(by.id("modular-drawer-search-input")).typeText("ETH");
    await waitFor(element(by.text("Ethereum")).atIndex(0))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.text("Ethereum")).atIndex(0).tap();
    // Currency lives on multiple networks → pick Ethereum.
    await waitFor(element(by.id(/network-item-ethereum/i)))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.id(/network-item-ethereum/i)).atIndex(0).tap();
    // First account auto-selected (only "Ethereum 1" is seeded).
    await waitFor(element(by.id("account-item-name-Ethereum 1")))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.id("account-item-name-Ethereum 1")).tap();

    // 5. To currency: USDT ERC20.
    const toSelector = webByTestId("to-account-coin-selector");
    await pollWeb(toSelector, 15_000);
    await toSelector.tap();
    await waitFor(element(by.id("modular-drawer-search-input")))
      .toBeVisible()
      .withTimeout(15_000);
    await element(by.id("modular-drawer-search-input")).typeText("USDT");
    await waitFor(element(by.text("Tether USD")).atIndex(0))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.text("Tether USD")).atIndex(0).tap();
    // USDT exists on many networks → pick Ethereum.
    await waitFor(element(by.id(/network-item-ethereum/i)))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.id(/network-item-ethereum/i)).atIndex(0).tap();
    // Token sub-account lives under "Ethereum 1" parent account.
    await waitFor(element(by.id("account-item-name-Ethereum 1")))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.id("account-item-name-Ethereum 1")).tap();

    // 6. The amount input is a custom keypad, not a text field. Tap the
    //    25% percentage toggle to populate it with a valid amount, then
    //    request quotes. swap.amount is updated below from the displayed
    //    value so verifyAmountsAndAcceptSwap matches what's on-device.
    const pct25 = webByTestId("mobile-keyboard-percentage-25%");
    await pollWeb(pct25, 15_000);
    await pct25.tap();
    const getQuotes = webByTestId("mobile-get-quotes-button");
    await pollWeb(getQuotes, 15_000);
    // Read the resulting from-amount from the DOM so the on-device
    // assertion later has the exact string the app sent.
    const amountVal = await webByTestId("from-account-amount-input").runScript(
      "el => el.value || el.textContent || ''",
    );
    if (typeof amountVal === "string" && amountVal.length > 0) {
      swap.amount = amountVal;
    }
    await getQuotes.tap();

    // 7. After quotes load, the button relabels to "View quotes" —
    //    same testID. Tap again to navigate to the quote selection page
    //    where each provider's card has its own Execute button.
    await new Promise(r => setTimeout(r, 4_000));
    await getQuotes.scrollToView();
    await getQuotes.tap();

    // 8. Wait for at least one provider quote card to render. Each
    //    card's data-testid starts with `compact-quote-card-provider-`.
    const firstQuoteCard = web.element(
      by.web.cssSelector("[data-testid^='compact-quote-card-provider-']"),
    );
    await pollWeb(firstQuoteCard, 60_000);

    // 9. Tap the first provider's Execute button.
    const executeBtn = webByTestId("execute-button").atIndex(0);
    await pollWeb(executeBtn, 10_000);
    await executeBtn.scrollToView();
    await executeBtn.tap();

    // 8. App now streams the swap APDUs to Speculos. Disable Detox
    //    sync — verifyAmountsAndAcceptSwap drives Speculos through
    //    Review Transaction → assert amounts → both-button confirm.
    await device.disableSynchronization();
    try {
      await verifyAmountsAndAcceptSwap(swap, swap.amount);
    } finally {
      await device.enableSynchronization();
    }

    // 9. Success indicator — the swap completion screen.
    await waitFor(element(by.id("swap-success-screen")))
      .toBeVisible()
      .withTimeout(60_000);
    await device.takeScreenshot("swap-success");
  });
});
