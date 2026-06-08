/**
 * ETH → ETH_USDT swap, end-to-end via Speculos.
 *
 * Mirrors `e2e/mobile/specs/swap/swapETH_ETH_USDT.spec.ts`. Drives the
 * Swap Live App webview, the swap-live-app step-approval, the native
 * SendFunds Summary, and tries to hand off to Speculos for signing.
 *
 *   1. Configure the Exchange Speculos to bundle the Ethereum app.
 *   2. Boot device-ready (seeded ETH + USDT subaccount) with
 *      lwmWallet40 + llmModularDrawer + ptxSwapLiveAppMobile flags;
 *      swapSetup pins SWAP_API_BASE to staging.
 *   3. Open the swap deeplink, fill the form (ETH + Ethereum, USDT +
 *      Ethereum), tap 25% percentage, request quotes.
 *   4. Pick the first provider's quote-card, tap its Execute button.
 *   5. Tap the step-approval button (swap-live-app "Sign to swap").
 *   6. Tap Continue on the native SendFunds Summary (Step 1 of 3).
 *   7. verifyAmountsAndAcceptSwap from live-common drives Speculos.
 *
 * Pre-reqs (env): SEED, COINAPPS (local) or REMOTE_SPECULOS=true +
 * SPECULINHO_URL.
 *
 * KNOWN GAP: Step 2 of 3 (Connect device) currently fails with
 * `GeneralDmkError`. e2e/mobile's setup also runs
 * `liveDataWithAddressCommand` (from @ledgerhq/live-common/e2e/cliCommandsUtils)
 * via `cliCommandsOnApp`, which spawns the live-cli against Speculos to
 * (a) derive accounts on-device and (b) seed the Exchange app's
 * swap-providers state. Our device-ready.json provides matching account
 * addresses by SEED, but does NOT seed the Exchange-side state — so the
 * actual swap APDU stream fails. Wiring the CLI commands into the
 * bridge / a new helper is the next iteration.
 */
import { device, element, by, expect, waitFor, web } from "detox";
import { launchApp, closeApp } from "../helpers/launchApp";
import { loadConfig } from "../helpers/loadConfig";
import { launchSpeculos, shutdownSpeculos, SpeculosHandle } from "../helpers/speculos";
import * as bridge from "../bridge/server";
import {
  setExchangeDependencies,
  verifyAmountsAndAcceptSwap,
} from "@ledgerhq/live-common/e2e/speculos";
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
    await element(by.id(/network-item-ethereum/i))
      .atIndex(0)
      .tap();
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
    await element(by.id(/network-item-ethereum/i))
      .atIndex(0)
      .tap();
    // Token sub-account lives under "Ethereum 1" parent account.
    await waitFor(element(by.id("account-item-name-Ethereum 1")))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.id("account-item-name-Ethereum 1")).tap();

    // 6. The amount input is a custom keypad. Tap the 25% percentage
    //    toggle to populate it with a valid amount.
    const pct25 = webByTestId("mobile-keyboard-percentage-25%");
    await pollWeb(pct25, 15_000);
    await pct25.tap();

    // 7. Tap "Get quotes". Then wait for `number-of-quotes` to appear —
    //    that's the canonical "quotes are ready" indicator in
    //    swap-live-app (matches e2e/mobile's waitForQuotes()).
    const getQuotes = webByTestId("mobile-get-quotes-button");
    await pollWeb(getQuotes, 15_000);
    // Read the from-amount string so verifyAmountsAndAcceptSwap matches
    // what's displayed on the device.
    const amountVal = await webByTestId("from-account-amount-input").runScript(
      "el => el.value || el.textContent || ''",
    );
    if (typeof amountVal === "string" && amountVal.length > 0) {
      swap.amount = amountVal;
    }
    await getQuotes.tap();

    // 8. Wait for the provider quote cards to populate the DOM. The
    //    current swap-live-app doesn't expose `number-of-quotes` —
    //    e2e/mobile's waitForQuotes() targets an older build. The
    //    canonical indicator here is `compact-quote-card-provider-name-*`.
    const firstProviderNameEl = web.element(
      by.web.cssSelector("[data-testid^='compact-quote-card-provider-name-']"),
    );
    await pollWeb(firstProviderNameEl, 60_000);
    const providerTestId = await firstProviderNameEl.runScript(
      "el => el.getAttribute('data-testid') || ''",
    );
    if (typeof providerTestId !== "string" || !providerTestId) {
      throw new Error(`could not read provider testID, got: ${String(providerTestId)}`);
    }
    const providerName = providerTestId.replace("compact-quote-card-provider-name-", "");

    // 9. The amount keypad overlays the bottom half of the screen — the
    //    quote cards are below it. Tap "View quotes" (same testID as
    //    Get quotes, just relabelled) to dismiss the keypad and bring
    //    the cards into the viewport.
    await getQuotes.scrollToView();
    await getQuotes.tap();

    // 10. Select the provider then tap the Execute button scoped to its
    //     quote container. e2e/mobile's tapExecuteSwap() matches the
    //     CSS `[data-testid^="quote-container-${name}"] [data-testid="execute-button"]`.
    await firstProviderNameEl.scrollToView();
    await firstProviderNameEl.tap();

    const executeBtn = web.element(
      by.web.cssSelector(
        `[data-testid^="quote-container-${providerName}"] [data-testid="execute-button"]`,
      ),
    );
    await pollWeb(executeBtn, 15_000);
    await executeBtn.scrollToView();
    await executeBtn.tap();

    // 11. Quote selection completes and the app navigates to a
    //     "Complete steps / Sign to swap" approval screen — matches
    //     e2e/mobile's `expectExecuteSwapOnStepApproval`. Tap that
    //     button to hand off to the native send flow.
    const stepApprovalBtn = webByTestId("execute-swap-button-step-approval");
    await pollWeb(stepApprovalBtn, 30_000);
    await stepApprovalBtn.scrollToView();
    await stepApprovalBtn.tap();

    // 12. swap-live-app hands off to the native SendFunds Summary
    //     screen (Step 1 of 3). Tap Continue to advance to the
    //     Connect Device / Sign step which actually streams APDUs to
    //     Speculos.
    //     NOTE: SendFunds/04-Summary.tsx sets testID="summary-continue-button"
    //     on a legacy ~/components/Button — same propagation gap as
    //     add-accounts-continue-button. Match by text instead.
    await waitFor(element(by.text("Continue")))
      .toBeVisible()
      .withTimeout(30_000);
    await element(by.text("Continue")).tap();

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
