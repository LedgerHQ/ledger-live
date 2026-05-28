import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { liveDataWithAddressCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { verifyAmountsAndAcceptSwap } from "@ledgerhq/live-common/e2e/speculos";
import { MaestroContext } from "../context";
import { withMaestroSession } from "../runtime/session";
import { performSwapUntilQuoteSelectionStep } from "../utils/swapUtils";

const SWAP_MANIFEST_ID =
  process.env.PRODUCTION === "true" ? "swap-live-app-aws" : "swap-live-app-stg-aws";

export async function runSwapEthUsdtSpec(ctx: MaestroContext) {
  const accountToDebit = Account.ETH_1;
  const accountToCredit = TokenAccount.ETH_USDT_1;

  const swap = new Swap(accountToDebit, accountToCredit, "0.018", undefined, Fee.MEDIUM);

  await withMaestroSession(
    ctx,
    {
      userdata: "skip-onboarding",
      mainSpeculos: {
        name: "Exchange",
        // USDT runs on the Ethereum app — the Exchange app needs only that dependency.
        deps: ["Ethereum"],
        testName: "maestro-swap-eth-usdt",
      },
      featureFlags: {
        ptxSwapLiveAppMobile: {
          enabled: true,
          params: { manifest_id: SWAP_MANIFEST_ID },
        },
      },
      cliCommandsOnApp: [
        { app: "Ethereum", cmd: liveDataWithAddressCommand(accountToDebit) },
        { app: "Ethereum", cmd: liveDataWithAddressCommand(accountToCredit) },
      ],
      swapSetup: true,
    },
    async () => {
      ctx.swap.openViaDeeplink();

      // Live-app context: wait for the swap WebView to be hosted and the
      // live-app DOM to be ready, then read the staging quote API for
      // the minimum amount.
      await ctx.switchToLiveApp("swap");
      await ctx.swapLiveApp.expectSwapLiveApp();

      const minAmount = await ctx.swapLiveApp.getMinimumAmount(accountToDebit, accountToCredit);
      if (!minAmount) {
        throw new Error(
          "[swapEthUsdt] No minimum amount returned by staging swap API; cannot proceed",
        );
      }

      // Drives the live-app form: FROM/TO selectors (account picks are
      // resolved via the bridge auto-pick mode enabled by `swapSetup: true`,
      // so the modular drawer never opens), amount input, get quotes.
      await performSwapUntilQuoteSelectionStep(ctx, accountToDebit, accountToCredit, minAmount);

      // Live-app context: pick a quote and execute.
      await ctx.switchToLiveApp("swap");
      const provider = await ctx.swapLiveApp.selectExchange();
      console.info(`[swapEthUsdt] selected provider: ${provider.uiName}`);
      await ctx.swapLiveApp.tapExecuteSwap();

      // Speculos drives device confirmation — independent of the
      // live-app/native split since it talks to the device directly.
      await verifyAmountsAndAcceptSwap(swap, minAmount);

      // Native context: assert the success screen and tap proceed.
      const native = await ctx.switchToNativeApp();
      await native.swap.waitForSuccessAndContinue();
    },
  );
}
