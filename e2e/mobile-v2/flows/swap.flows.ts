import pages from "@e2e-mobile/pages/pages";

import type { Account } from "@ledgerhq/live-e2e-shared/enum/Account";

async function selectCurrency(account: Account, isFromCurrency: boolean = true) {
  // Check the appropriate field based on whether we're selecting FROM or TO
  const currentCurrencyText = isFromCurrency
    ? await pages.swapLiveApp.getFromCurrencyTexts()
    : await pages.swapLiveApp.getToCurrencyTexts();

  if (!currentCurrencyText.includes(account.currency.ticker)) {
    if (isFromCurrency) {
      await pages.swapLiveApp.tapFromCurrency();
    } else {
      await pages.swapLiveApp.tapToCurrency();
    }
    await pages.modularDrawer.selectAsset(account);
    await pages.swapLiveApp.verifyCurrencyIsSelected(account.currency.ticker, isFromCurrency);
  }
}

export async function performSwapUntilQuoteSelectionStep(
  accountToDebit: Account,
  accountToCredit: Account,
  amount: string,
  continueToQuotes: boolean = true,
) {
  await selectCurrency(accountToDebit, true);
  await selectCurrency(accountToCredit, false);
  await pages.swapLiveApp.inputFromAmount(amount);
  if (continueToQuotes) {
    await pages.swapLiveApp.expectToAmountFloat();
    await pages.swapLiveApp.tapGetQuotesButton();
    await pages.swapLiveApp.waitForQuotes();
  }
}
