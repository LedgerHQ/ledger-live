import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { liveDataWithAddressCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { verifyAmountsAndAcceptSwap } from "@ledgerhq/live-common/e2e/speculos";
import { getMinimumSwapAmount } from "@ledgerhq/live-common/e2e/swap";
import { MaestroContext } from "../context";
import { SWAP_LIVE_APP_MANIFEST_ID } from "../config/swap";
import { withMaestroSession } from "../runtime/session";
import { performSwapUntilQuoteSelectionStep } from "../utils/swapUtils";

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
        deps: ["Ethereum"],
        testName: "maestro-swap-eth-usdt",
      },
      featureFlags: {
        ptxSwapLiveAppMobile: {
          enabled: true,
          params: { manifest_id: SWAP_LIVE_APP_MANIFEST_ID },
        },
      },
      cliCommandsOnApp: [
        { app: "Ethereum", cmd: liveDataWithAddressCommand(accountToDebit) },
        { app: "Ethereum", cmd: liveDataWithAddressCommand(accountToCredit) },
      ],
      swapSetup: true,
    },
    async () => {
      await ctx.swap.openViaDeeplink();

      await ctx.switchToLiveApp();
      await ctx.swapLiveApp.expectSwapLiveApp();

      const min = await getMinimumSwapAmount(accountToDebit, accountToCredit);
      if (min === null || min === undefined) {
        throw new Error(
          "[swapEthUsdt] No minimum amount returned by staging swap API; cannot proceed",
        );
      }
      const minAmount = String(min);

      await performSwapUntilQuoteSelectionStep(ctx, accountToDebit, accountToCredit, minAmount);

      await ctx.switchToLiveApp();
      const provider = await ctx.swapLiveApp.selectExchange();
      console.info(`[swapEthUsdt] selected provider: ${provider.uiName}`);
      await ctx.swapLiveApp.checkExchangeButtonHasProviderName(provider.uiName);
      await ctx.swapLiveApp.tapExecuteSwap();

      await verifyAmountsAndAcceptSwap(swap, minAmount);

      await ctx.swap.waitForSuccessAndContinue();
    },
  );
}
