/**
 * ETH → ETH_USDT swap via a DEX (OKX), end-to-end via Speculos.
 *
 * Mirrors `e2e/mobile/specs/swap/swapETH_ETH_USDT.spec.ts`. Page-object
 * driven: UI steps go through `app.*` (swap live-app webview → step-approval
 * → native SendFunds Summary); the Speculos/device choreography (blind-signing
 * toggle, screen polling, signing) stays inline as it isn't UI.
 *
 *   1. Boot device-ready (seeded ETH + USDT subaccount) with
 *      lwmWallet40 + llmModularDrawer + ptxSwapLiveAppMobile flags;
 *      swapSetup pins SWAP_API_BASE to staging.
 *   2. Open the swap deeplink, fill the form (ETH + Ethereum, USDT +
 *      Ethereum), tap 25% percentage, request quotes.
 *   3. Pick OKX's quote-card, tap its Execute button, then the step-approval.
 *   4. Continue on the native SendFunds Summary (Step 1 of 3).
 *   5. verifyAmountsAndAcceptSwap from live-common drives Speculos.
 *
 * Pre-reqs (env): SEED, COINAPPS (local) or REMOTE_SPECULOS=true + SPECULINHO_URL.
 *
 * Broadcast is disabled (bridge default), so a DEX swap is signed on-device
 * but never broadcast — the live-app returns to the step-approval screen
 * rather than a success screen, which is what step 14 asserts.
 */
import { device } from "detox";
import { startSession, endSession } from "../../helpers/session";
import { SpeculosHandle } from "../../helpers/speculos";
import { sleep } from "../../helpers/timeouts";
import * as bridge from "../../bridge/server";
import {
  pressUntilTextFound,
  setExchangeDependencies,
  verifyAmountsAndAcceptSwap,
} from "@ledgerhq/live-common/e2e/speculos";
import { DeviceLabels } from "@ledgerhq/live-common/e2e/enum/DeviceLabels";
import { getMinimumSwapAmount } from "@ledgerhq/live-common/e2e/swap";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { liveDataWithAddressCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { app } from "../../pages";
import { performSwapUntilQuotes } from "../../flows/swap/swapFlow";

describe("Swap — ETH → ETH_USDT via Speculos", () => {
  let handle: SpeculosHandle;
  // provider = OKX so verifySwapData looks for the provider name on
  // the device instead of "swap ETH to USDT" — OKX is a DEX whose
  // provider.app = AppInfos.ETHEREUM, which makes verifySwapData
  // branch into provider-name validation.
  const swap = new Swap(Account.ETH_1, TokenAccount.ETH_USDT_1, "0", SwapProvider.OKX, Fee.MEDIUM);

  beforeAll(async () => {
    // OKX is a DEX provider — `SwapProvider.OKX.app = AppInfos.ETHEREUM`,
    // so the swap APDUs go to the Ethereum app directly, NOT Exchange.
    // (Exchange is for centralized providers like Changelly.) Launching
    // Exchange here previously hit GeneralDmkError because the app
    // received Ethereum-signing APDUs that Exchange doesn't handle.
    // setExchangeDependencies is kept for parity with e2e/mobile — it
    // mutates specs["Exchange"] which is unused in this flow but free.
    setExchangeDependencies([{ name: "Ethereum" }]);
    handle = await startSession({ userdata: "device-ready", speculosApp: "Ethereum" });
    // Derive the account addresses on-device and populate the Account
    // singletons, exactly like e2e/mobile's swap setup (cliCommandsOnApp
    // → liveDataWithAddressCommand). getMinimumSwapAmount needs
    // accountFrom.address; this also seeds the addresses live-common's
    // swap helpers rely on. Run while the Ethereum app is up, before the
    // blind-signing navigation below.
    await liveDataWithAddressCommand(Account.ETH_1)();
    await liveDataWithAddressCommand(TokenAccount.ETH_USDT_1)();
    // OKX swaps go through a DEX contract — Speculos's Ethereum app
    // refuses to sign contract calls unless "Blind signing" (the
    // newer firmware name for "Contract data") is on. live-common's
    // `activateContractData` waits for the old label "Contract data"
    // which the current Ethereum app shows as "Blind signing", so it
    // throws after entering Settings. We do the same navigation but
    // toggle the first Settings item directly via Speculos's HTTP
    // button API: pressUntilTextFound navigates Settings into view,
    // first `both` enters Settings, second `both` toggles the first
    // item (Blind signing / Contract data depending on firmware).
    const pressBoth = async () =>
      fetch(`${handle.address}/button/both`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "press-and-release" }),
      });
    await pressUntilTextFound(DeviceLabels.SETTINGS);
    await pressBoth(); // enter Settings
    await sleep(300);
    await pressBoth(); // toggle the first item (Blind signing → Enabled)
    await sleep(300);
    await pressUntilTextFound("Back");
    await pressBoth();
    await bridge.swapSetup();
  });

  afterAll(() => endSession(handle));

  it("ETH to ETH_USDT", async () => {
    // 1. Minimum swap amount the API accepts right now (needs the address
    //    derived in beforeAll).
    const min = await getMinimumSwapAmount(Account.ETH_1, TokenAccount.ETH_USDT_1);
    if (!min) throw new Error("getMinimumSwapAmount returned null");
    swap.amount = String(min);

    // 2. Open the Swap Live App and wait for the form.
    await app.swapLiveApp.openViaDeeplink();

    // 3. Fill the form (ETH from, USDT to, min amount) and request quotes via
    //    the shared helper. It skips the drawer when a side already shows the
    //    ticker; keep swap.amount aligned with the displayed (possibly
    //    reformatted) from-amount for verifyAmountsAndAcceptSwap.
    const displayed = await performSwapUntilQuotes(
      Account.ETH_1,
      TokenAccount.ETH_USDT_1,
      String(min),
    );
    if (displayed) swap.amount = displayed;

    // 4. Hardcode OKX so the test is deterministic — wait for its specific
    //    quote card (fails fast if OKX doesn't quote this pair).
    const provider = SwapProvider.OKX.name;
    await app.swapLiveApp.waitForProvider(provider);

    // 5. Select OKX's quote card (selectProvider scrolls it into view), then execute.
    await app.swapLiveApp.selectProvider(provider);
    await app.swapLiveApp.waitForExecuteReady(provider);
    await app.swapLiveApp.tapExecute(provider);

    // 6. Quote selection navigates to the "Complete steps / Sign to swap"
    //    step-approval screen — tap it to hand off to the native send flow.
    await app.swapLiveApp.confirmStepApproval();

    // 7. Hands off to the native SendFunds Summary (Step 1 of 3). Wait for
    //     Continue with sync ON (clean transition), then disable Detox sync
    //     BEFORE tapping — Continue advances to Connect device, which streams
    //     swap APDUs and would otherwise deadlock Detox's wait-for-idle.
    await app.common.expectContinue();
    await device.disableSynchronization();
    await app.common.tapContinue();

    // 8. High Fee modal — appears when network fees are >10% of the swap
    //     amount (the OKX router call has a non-trivial fee on small amounts).
    //     Dismissed silently if not shown.
    await app.send.dismissHighFeeModal();

    // 9. Speculos's Ethereum app shows a "Blind signing ahead" warning before
    //     "Review transaction" for a contract call with blind signing on.
    //     verifyAmountsAndAcceptSwap doesn't know this intermediate screen —
    //     poll for it and press both via the Speculos HTTP button API.
    const screenAddr = `${handle.address}/events?stream=false&currentscreenonly=true`;
    const pressBoth = async () =>
      fetch(`${handle.address}/button/both`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "press-and-release" }),
      });
    for (let attempt = 0; attempt < 60; attempt++) {
      const r = await fetch(screenAddr);
      const data = (await r.json()) as { events: { text: string }[] };
      const screen = data.events.map(e => e.text).join(" ");
      if (/blind signing ahead/i.test(screen)) {
        await pressBoth();
        break;
      }
      if (/review transaction/i.test(screen)) break;
      await sleep(500);
    }

    // 10. Drive Speculos to sign. DEX swaps via the Ethereum app surface raw
    //     From/Amount/To/Max fees/Tx hash — not an Exchange "swap X to Y" line
    //     nor the provider uiName — so verifySwapData throws. Let the function
    //     walk the review screens, swallow that verification throw, and press
    //     both manually to confirm.
    try {
      await verifyAmountsAndAcceptSwap(swap, swap.amount);
    } catch (e) {
      const msg = String(e);
      if (!/Provider not found|Swap pair not found|Amount .* not found/.test(msg)) throw e;
      await pressBoth();
    }

    // 11. Terminal state. With broadcast disabled the signed tx is produced on
    //     device but never broadcast, so there's no on-chain hash and the
    //     live-app returns to the step-approval ("Sign to swap") screen rather
    //     than a success screen — mirrors e2e/mobile's expectExecuteSwapOnStepApproval.
    await app.swapLiveApp.expectBackOnStepApproval();
  });
});
