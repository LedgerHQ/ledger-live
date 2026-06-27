/**
 * CEX swap test runner — registers a full describe/beforeAll/afterAll/it for a
 * single-app (non-KYC) Exchange swap, end-to-end via Speculos. Mirrors
 * e2e/mobile's specs/swap/swap.ts `runSwapTest`. Per-pair detail is derived
 * from the Accounts; the reusable form interactions live in ./swapFlow and the
 * address-derivation boot in ./swapBoot. Call at the top level of a `*.test.ts`:
 *
 *   runCexSwapTest(Account.ETH_1, TokenAccount.ETH_USDT_1);
 *
 * Not a spec itself (no `.test.ts` suffix) so jest never collects it.
 */
import { device } from "detox";
import { endSession } from "../../helpers/session";
import { launchSpeculos, SpeculosHandle } from "../../helpers/speculos";
import * as bridge from "../../bridge/server";
import {
  setExchangeDependencies,
  verifyAmountsAndAcceptSwap,
} from "@ledgerhq/live-common/e2e/speculos";
import { getMinimumSwapAmount } from "@ledgerhq/live-common/e2e/swap";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { app } from "../../pages";
import { performSwapUntilQuotes, firstQuotedProvider } from "./swapFlow";
import { deriveSwapAddresses } from "./swapBoot";

/**
 * The CEX providers we're willing to pick: single-app (no DEX `app`) and
 * non-KYC. Listed in the same priority order as the staging providers
 * whitelist so the first one with a quote wins.
 */
export const CEX_PROVIDERS: SwapProvider[] = [
  SwapProvider.CHANGELLY,
  SwapProvider.EXODUS,
  SwapProvider.CIC,
  SwapProvider.NEAR_INTENTS,
  SwapProvider.SWAPSXYZ,
  SwapProvider.MOONPAY_TRADE,
];

export function runCexSwapTest(
  accountToDebit: Account,
  accountToCredit: Account,
  opts: { fee?: Fee } = {},
): void {
  const fromTicker = accountToDebit.currency.ticker;
  const toTicker = accountToCredit.currency.ticker;
  const swap = new Swap(accountToDebit, accountToCredit, "0", undefined, opts.fee ?? Fee.MEDIUM);

  describe(`Swap — ${fromTicker} → ${toTicker} via Exchange (CEX)`, () => {
    let handle: SpeculosHandle;

    beforeAll(async () => {
      // Exchange needs every coin app involved as a dependency (cross-chain
      // swaps touch two). setExchangeDependencies de-dupes by name, so passing
      // both sides is fine when they share an app (e.g. ETH + ETH_USDT).
      setExchangeDependencies(
        [accountToDebit, accountToCredit].map(a => ({ name: a.currency.speculosApp.name })),
      );

      // Derive both addresses on their own coin apps (getMinimumSwapAmount + the
      // swap helpers need them); leaves no Speculos running.
      await deriveSwapAddresses([accountToDebit, accountToCredit]);

      // Swap Speculos over to Exchange for signing, then open the form here so
      // its ~8s webview boot is setup cost — mirrors e2e/mobile's swap.setup.
      handle = await launchSpeculos("Exchange");
      await bridge.swapSetup();
      await app.swapLiveApp.openViaDeeplink();
    });

    afterAll(() => endSession(handle));

    it(`${fromTicker} to ${toTicker}`, async () => {
      // 1. Minimum the API accepts now (needs the addresses derived above), then
      //    fill the form through to quotes.
      const min = await getMinimumSwapAmount(accountToDebit, accountToCredit);
      if (!min) throw new Error("getMinimumSwapAmount returned null");
      swap.amount = await performSwapUntilQuotes(accountToDebit, accountToCredit, String(min));

      // 2. Pick the first available single-app CEX provider — mirrors
      //    selectExchange()'s "single-app, non-KYC" filter.
      const provider = await firstQuotedProvider(CEX_PROVIDERS);
      if (!provider) {
        throw new Error(
          `No single-app CEX provider returned a quote for ${fromTicker} → ${toTicker}`,
        );
      }

      // 3. Ready the Execute button, then disable Detox sync BEFORE tapping:
      //    Execute opens the Exchange device action, which keeps an APDU
      //    long-poll open — with sync on, Detox waits forever for app-idle.
      await app.swapLiveApp.selectProvider(provider.name);
      await app.swapLiveApp.waitForExecuteReady(provider.name);
      await device.disableSynchronization();
      await app.swapLiveApp.tapExecute(provider.name);

      // 4. CEX flow hands straight to the device — verifyAmountsAndAcceptSwap
      //    drives Speculos through Review → assert "swap X to Y" + amounts →
      //    Sign — then the PendingOperation success screen.
      await verifyAmountsAndAcceptSwap(swap, swap.amount);
      await app.swap.expectSuccess();
    }, 300_000);
  });
}
