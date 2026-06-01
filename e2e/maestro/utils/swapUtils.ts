import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { MaestroContext } from "../context";
import { CurrencyField } from "../pages/swapLiveApp";

async function selectCurrency(
  ctx: MaestroContext,
  account: Account | TokenAccount,
  field: CurrencyField,
): Promise<void> {
  const ticker = account.currency.ticker;
  await ctx.switchToLiveApp();

  const currentText = await ctx.swapLiveApp.getCurrencyText(field);
  if (currentText.includes(ticker)) return;

  await ctx.swapLiveApp.tapCurrency(field);
  await ctx.modularDrawer.selectAsset(account);
  await ctx.swapLiveApp.waitForCurrency(field, ticker);
}

export async function performSwapUntilQuoteSelectionStep(
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
