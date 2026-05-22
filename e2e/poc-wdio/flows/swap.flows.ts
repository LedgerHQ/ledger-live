import pages from "../pages/pages.ts";

import type { Account } from "@ledgerhq/live-common/e2e/enum/Account";

async function selectCurrency(account: Account, isFromCurrency: boolean = true) {
  // Check the appropriate field based on whether we're selecting FROM or TO
  const currentCurrencyText = isFromCurrency
    ? await pages.swapLiveApp.getFromCurrencyTexts()
    : await pages.swapLiveApp.getToCurrencyTexts();

  if (currentCurrencyText.includes(account.currency.ticker)) {
    return;
  }
  if (isFromCurrency) {
    await pages.swapLiveApp.tapFromCurrency();
  } else {
    await pages.swapLiveApp.tapToCurrency();
  }
  if (await pages.modularDrawer.isFlowEnabled("live_app")) {
    await pages.modularDrawer.selectAsset(account);
  } else {
    // TODO: implement this
    // await pages.common.performSearch(account.currency.name);
    // await pages.stake.selectCurrency(account.currency.id);
    // await pages.common.selectFirstAccount();
  }
  await pages.swapLiveApp.verifyCurrencyIsSelected(account.currency.ticker, isFromCurrency);
}

export async function performSwapUntilQuoteSelectionStep(
  accountToDebit: Account,
  accountToCredit: Account,
  amount: string,
  continueToQuotes: boolean = true,
) {
  await selectCurrency(accountToDebit, true);
  await selectCurrency(accountToCredit, false);
  await driver.debug(); // Debug to check if the correct currencies are selected before inputting the amount
  await pages.swapLiveApp.inputFromAmount(amount);
  if (continueToQuotes) {
    await pages.swapLiveApp.expectToAmountFloat();
    await pages.swapLiveApp.tapGetQuotesButton();
    await pages.swapLiveApp.waitForQuotes();
  }
}

// TODO: implement this!
// export async function ensureTokenApproval(
//   fromAccount: Account | TokenAccount,
//   provider: Provider,
//   minAmount: string,
// ) {
//   if (!provider.contractAddress || !fromAccount.parentAccount) return;

//   const currentAllowance = await isTokenAllowanceSufficientCommand(
//     fromAccount,
//     provider.contractAddress,
//     minAmount,
//   );
//   log.warn("CLI result: Current Allowance: ", currentAllowance);
//   if (currentAllowance) return;

//   const previousSpeculosPort = getEnv("SPECULOS_API_PORT");
//   const speculos = await SpeculosUtils.launchSpeculos(fromAccount.currency.speculosApp.name);
//   await SpeculosUtils.registerSpeculos(speculos.port);
//   try {
//     const result = await approveTokenCommand(
//       fromAccount,
//       provider.contractAddress,
//       new BigNumber(minAmount).times(12).div(10).toFixed(),
//     );
//     //     await allure.description(`Token approval result for ${provider.uiName}:\n\n ${result}`);
//   } finally {
//     await SpeculosUtils.deleteSpeculos(speculos.id);
//     if (previousSpeculosPort > 0) {
//       await SpeculosUtils.registerSpeculos(previousSpeculosPort);
//     }
//   }
// }
