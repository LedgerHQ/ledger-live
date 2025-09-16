import { SwapType } from "@ledgerhq/live-common/lib/e2e/models/Swap";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

async function selectCurrency(account: Account, isFromCurrency: boolean = true) {
  const currentCurrencyText = await app.swapLiveApp.getFromCurrencyTexts();

  if (currentCurrencyText.includes(account.currency.ticker)) {
    return;
  }
  if (isFromCurrency) {
    await app.swapLiveApp.tapFromCurrency();
  } else {
    await app.swapLiveApp.tapToCurrency();
  }
  await app.common.performSearch(account.currency.name);
  await app.stake.selectCurrency(account.currency.id);
  await app.common.selectFirstAccount();
  await app.swapLiveApp.verifyCurrencyIsSelected(account.currency.ticker, isFromCurrency);
}

export async function performSwapUntilQuoteSelectionStep(
  accountToDebit: Account,
  accountToCredit: Account,
  amount: string,
  continueToQuotes: boolean = true,
) {
  await selectCurrency(accountToDebit, true);
  await selectCurrency(accountToCredit, false);
  await app.swapLiveApp.inputAmount(amount);

  if (continueToQuotes) {
    await app.swapLiveApp.tapGetQuotesButton();
    await app.swapLiveApp.waitForQuotes();
  }
}
