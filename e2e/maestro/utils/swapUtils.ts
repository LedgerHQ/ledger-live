import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { verifyAmountsAndAcceptSwap } from "@ledgerhq/live-common/e2e/speculos";
import { MaestroContext } from "../context";
import { CurrencyField } from "../pages/swapLiveApp";

async function selectCurrency(
  ctx: MaestroContext,
  account: Account | TokenAccount,
  field: CurrencyField,
): Promise<void> {
  await ctx.switchToLiveApp();
  await ctx.swapLiveApp.tapCurrency(field);
  ctx.modularDrawer.selectAsset(account);
}

export async function buildSwapUntilQuoteSelection(
  ctx: MaestroContext,
  accountToDebit: Account | TokenAccount,
  accountToCredit: Account | TokenAccount,
  amount: string,
): Promise<void> {
  await selectCurrency(ctx, accountToDebit, "from");
  await selectCurrency(ctx, accountToCredit, "to");

  await ctx.switchToLiveApp();
  await ctx.swapLiveApp.inputAmount(amount);
  await ctx.swapLiveApp.waitForReceiveAmountEstimate();
  await ctx.swapLiveApp.tapGetQuotes();
  await ctx.swapLiveApp.waitForQuotes();
}

export async function executeSwapAndAccept(
  ctx: MaestroContext,
  swap: Swap,
  amount: string,
): Promise<void> {
  await ctx.swapLiveApp.selectProviderAndExecute();
  ctx.swap.waitForSuccessAndContinue();

  const results = await Promise.allSettled([
    ctx.runFlow("swap-eth-usdt"),
    acceptSwapOnDevice(swap, amount),
  ]);
  const failure = results.find(result => result.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
}

export async function acceptSwapOnDevice(swap: Swap, amount: string, maxWaits = 8): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await verifyAmountsAndAcceptSwap(swap, amount);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const deviceNotReadyYet = /not found on device screen/i.test(message);
      if (deviceNotReadyYet && attempt < maxWaits) continue;
      throw error;
    }
  }
}
