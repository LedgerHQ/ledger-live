import pages from "../pages/pages.ts";

import type { Account } from "@ledgerhq/live-common/e2e/enum/Account";

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
    if (await pages.modularDrawer.isFlowEnabled("live_app")) {
      await driver.switchAppiumContext("NATIVE_APP");
      await pages.modularDrawer.selectAsset(account);
    } else {
      // TODO: implement this
      // await pages.common.performSearch(account.currency.name);
      // await pages.stake.selectCurrency(account.currency.id);
      // await pages.common.selectFirstAccount();
    }
    await pages.swapLiveApp.switchTo();
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
