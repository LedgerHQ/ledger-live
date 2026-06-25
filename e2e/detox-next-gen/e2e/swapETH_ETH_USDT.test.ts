/**
 * ETH → ETH_USDT swap via a centralized (CEX) provider, end-to-end via
 * Speculos. Mirrors `e2e/mobile/specs/swap/swapETH_ETH_USDT.spec.ts`.
 *
 * Page-object driven: UI steps go through `app.*`; device/bridge/live-common
 * setup stays inline. The in-webview form is `app.swapLiveApp`, the native
 * success screen is `app.swap`, asset selection is `app.modularDrawer`.
 *
 * Pre-reqs (env): SEED, COINAPPS (local) or REMOTE_SPECULOS=true + SPECULINHO_URL.
 */
import { device } from "detox";
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
import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { liveDataWithAddressCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { app } from "../pages";

const hasSpeculosEnv =
  !!process.env.SEED && (!!process.env.COINAPPS || process.env.REMOTE_SPECULOS === "true");

const maybeDescribe = hasSpeculosEnv ? describe : describe.skip;

/**
 * The CEX providers we're willing to pick: single-app (no DEX `app`) and
 * non-KYC. Listed in the same priority order as the staging providers
 * whitelist so the first one with a quote wins.
 */
const CEX_PROVIDERS = [
  SwapProvider.CHANGELLY,
  SwapProvider.EXODUS,
  SwapProvider.CIC,
  SwapProvider.NEAR_INTENTS,
  SwapProvider.SWAPSXYZ,
  SwapProvider.MOONPAY_TRADE,
];

maybeDescribe("Swap — ETH → ETH_USDT via Exchange (CEX)", () => {
  let handle: SpeculosHandle;
  const swap = new Swap(Account.ETH_1, TokenAccount.ETH_USDT_1, "0", undefined, Fee.MEDIUM);

  beforeAll(async () => {
    setExchangeDependencies([{ name: "Ethereum" }]);
    await launchApp();
    await loadConfig("device-ready");

    const ethHandle = await launchSpeculos("Ethereum");
    await liveDataWithAddressCommand(Account.ETH_1)();
    await liveDataWithAddressCommand(TokenAccount.ETH_USDT_1)();
    await shutdownSpeculos(ethHandle);

    handle = await launchSpeculos("Exchange");
    await bridge.swapSetup();
  });

  afterAll(async () => {
    if (handle) await shutdownSpeculos(handle);
    closeApp();
  });

  it("ETH to ETH_USDT", async () => {
    // 1. Minimum swap amount the API accepts right now (needs the address
    //    derived above).
    const min = await getMinimumSwapAmount(Account.ETH_1, TokenAccount.ETH_USDT_1);
    if (!min) throw new Error("getMinimumSwapAmount returned null");
    swap.amount = String(min);

    // 2. Open the Swap Live App and wait for the form.
    await app.swapLiveApp.openViaDeeplink();

    // 3. From currency: ETH on Ethereum.
    await app.swapLiveApp.tapFromSelector();
    await app.modularDrawer.chooseAsset("ETH", "Ethereum");
    await app.modularDrawer.selectNetwork("ethereum");
    await app.modularDrawer.selectAccount("Ethereum 1");

    // 4. To currency: USDT (ERC20) on Ethereum.
    await app.swapLiveApp.tapToSelector();
    await app.modularDrawer.chooseAsset("USDT", "Tether USD");
    await app.modularDrawer.selectNetwork("ethereum");
    await app.modularDrawer.selectAccount("Ethereum 1");

    // 5. Populate the amount via the 25% percentage toggle.
    await app.swapLiveApp.setPercentage("25%");

    // 6. Read the displayed from-amount so verifyAmountsAndAcceptSwap
    //    matches the device screen, then request quotes.
    const displayed = await app.swapLiveApp.getSendAmount();
    if (displayed) swap.amount = displayed;
    await app.swapLiveApp.getQuotes();

    // 7. Wait for quotes, then pick the first available single-app CEX
    //    provider — mirrors selectExchange()'s "single-app, non-KYC" filter.
    await app.swapLiveApp.waitForAnyQuote();
    let provider: SwapProvider | undefined;
    for (const candidate of CEX_PROVIDERS) {
      if (await app.swapLiveApp.hasProvider(candidate.name)) {
        provider = candidate;
        break;
      }
    }
    if (!provider) {
      throw new Error("No single-app CEX provider returned a quote for ETH → USDT");
    }

    // 8. Dismiss the keypad overlay (View quotes), then select the provider.
    await app.swapLiveApp.viewQuotes();
    await app.swapLiveApp.selectProvider(provider.name);

    // 9. Ready the Execute button, then disable Detox sync BEFORE tapping:
    //    Execute opens the Exchange device action, which keeps an APDU
    //    long-poll open — with sync on, Detox waits forever for app-idle
    //    and the tap never returns.
    await app.swapLiveApp.waitForExecuteReady(provider.name);
    await device.disableSynchronization();
    await app.swapLiveApp.tapExecute(provider.name);

    // 10. CEX flow hands straight to the device — no step-approval /
    //     SendFunds Summary (that's the DEX native flow).
    //     verifyAmountsAndAcceptSwap drives Speculos through Review
    //     transaction → assert "swap ETH to USDT" + amounts → Sign.
    await verifyAmountsAndAcceptSwap(swap, swap.amount);

    // 11. Success — the PendingOperation screen (swap-success-title). CEX
    //     swaps reach it even with broadcast disabled.
    await app.swap.expectSuccess();
    await device.takeScreenshot("swap-cex-success");
  }, 300_000);
});
