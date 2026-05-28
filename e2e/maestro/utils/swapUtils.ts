import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { MaestroContext } from "../context";

function getTickerForSelection(account: Account | TokenAccount): string {
  return account.currency.ticker;
}

/**
 * Pick the FROM/TO account in the swap WebView.
 *
 * The session enables E2E auto-pick (`bridge.setAutoPickAccount(true)`) when
 * `swapSetup: true` is set, so tapping the from/to selector fires
 * wallet-api `account.request` and the in-app handler immediately resolves
 * the first account matching the requested currency — no modular drawer is
 * shown. We then wait for the WebView selector to reflect the picked asset
 * before moving on.
 *
 * Maestro can't drive the modular drawer on iOS because it renders as a
 * sheet over the WebView and crashes XCUITest's view-hierarchy snapshot.
 * The auto-pick path side-steps that entirely.
 */
async function selectCurrency(
  ctx: MaestroContext,
  account: Account | TokenAccount,
  isFromCurrency: boolean,
): Promise<void> {
  const ticker = getTickerForSelection(account);

  await ctx.switchToLiveApp("swap");

  const currentText = isFromCurrency
    ? await ctx.swapLiveApp.getFromCurrencyText()
    : await ctx.swapLiveApp.getToCurrencyText();

  if (currentText.includes(ticker)) {
    return;
  }

  if (isFromCurrency) {
    await ctx.swapLiveApp.tapFromCurrency();
  } else {
    await ctx.swapLiveApp.tapToCurrency();
  }

  // Auto-pick fulfills account.request synchronously on the app side, then
  // the live-app updates the selector. Poll the selector until it reflects
  // the requested ticker so we don't move on while the live-app is still
  // catching up.
  await waitForSelectorTicker(ctx, isFromCurrency, ticker);
}

async function waitForSelectorTicker(
  ctx: MaestroContext,
  isFromCurrency: boolean,
  ticker: string,
  timeoutMs: number = 30_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastText = "";
  while (Date.now() < deadline) {
    lastText = isFromCurrency
      ? await ctx.swapLiveApp.getFromCurrencyText()
      : await ctx.swapLiveApp.getToCurrencyText();
    if (lastText.includes(ticker)) return;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(
    `[swap] ${isFromCurrency ? "FROM" : "TO"} selector never showed ticker "${ticker}" within ${timeoutMs}ms (last="${lastText}")`,
  );
}

export async function performSwapUntilQuoteSelectionStep(
  ctx: MaestroContext,
  accountToDebit: Account | TokenAccount,
  accountToCredit: Account | TokenAccount,
  amount: string,
): Promise<void> {
  await selectCurrency(ctx, accountToDebit, true);
  await selectCurrency(ctx, accountToCredit, false);

  await ctx.switchToLiveApp("swap");
  await ctx.swapLiveApp.inputAmount(amount);
  await ctx.swapLiveApp.tapGetQuotes();
  await ctx.swapLiveApp.waitForQuotes();
}
