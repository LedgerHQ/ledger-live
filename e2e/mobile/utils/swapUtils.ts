import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { SwapProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { allure } from "jest-allure2-reporter/api";
import { floatNumberRegex } from "@ledgerhq/live-common/e2e/data/regexes";
import { getEnv } from "@ledgerhq/live-env";
import BigNumber from "bignumber.js";
import { deleteSpeculos, launchSpeculos, registerSpeculos } from "./speculosUtils";
import { log } from "detox";

async function selectCurrency(account: Account, isFromCurrency: boolean = true) {
  // Check the appropriate field based on whether we're selecting FROM or TO
  const currentCurrencyText = isFromCurrency
    ? await app.swapLiveApp.getFromCurrencyTexts()
    : await app.swapLiveApp.getToCurrencyTexts();

  if (currentCurrencyText.includes(account.currency.ticker)) {
    return;
  }
  if (isFromCurrency) {
    await app.swapLiveApp.tapFromCurrency();
  } else {
    await app.swapLiveApp.tapToCurrency();
  }
  if (await app.modularDrawer.isFlowEnabled("live_app")) {
    await app.modularDrawer.selectAsset(account);
  } else {
    await app.common.performSearch(account.currency.name);
    await app.stake.selectCurrency(account.currency.id);
    await app.common.selectFirstAccount();
  }
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
    await waitForWebElementToMatchRegex(app.swapLiveApp.toAmountInput, floatNumberRegex, 20000);
    await app.swapLiveApp.tapGetQuotesButton();
    await app.swapLiveApp.waitForQuotes();
  }
}
export async function ensureTokenApproval(
  fromAccount: Account | TokenAccount,
  provider: SwapProvider,
  minAmount: string,
) {
  if (!provider.contractAddress || !fromAccount.parentAccount) return;

  const currentAllowance = await isTokenAllowanceSufficientCommand(
    fromAccount,
    provider.contractAddress,
    minAmount,
  );
  log.warn("CLI result: Current Allowance: ", currentAllowance);
  if (currentAllowance) return;

  const previousSpeculosPort = getEnv("SPECULOS_API_PORT");
  const speculos = await launchSpeculos(fromAccount.currency.speculosApp.name);
  await registerSpeculos(speculos.port);
  try {
    const result = await approveTokenCommand(
      fromAccount,
      provider.contractAddress,
      new BigNumber(minAmount).times(12).div(10).toFixed(),
    );
    await allure.description(`Token approval result for ${provider.uiName}:\n\n ${result}`);
  } finally {
    await deleteSpeculos(speculos.id);
    if (previousSpeculosPort > 0) {
      await registerSpeculos(previousSpeculosPort);
    }
  }
}

export async function revokeTokenApproval(
  fromAccount: Account | TokenAccount,
  provider: SwapProvider,
) {
  if (!provider.contractAddress || !fromAccount.parentAccount) return;

  let allowance = await getTokenAllowanceCommand(fromAccount, provider.contractAddress);
  if (allowance !== "0") {
    const previousSpeculosPort = getEnv("SPECULOS_API_PORT");
    const speculos = await launchSpeculos(fromAccount.currency.speculosApp.name);
    await registerSpeculos(speculos.port);
    try {
      const result = await revokeTokenCommand(fromAccount, provider.contractAddress);
      await allure.description(`Token revoke result for ${provider.uiName}:\n\n ${result}`);
    } finally {
      await deleteSpeculos(speculos.id);
      if (previousSpeculosPort > 0) {
        await registerSpeculos(previousSpeculosPort);
      }
    }
    allowance = await getTokenAllowanceCommand(fromAccount, provider.contractAddress);
  }
  if (allowance !== "0") {
    throw new Error(
      `Token allowance revoke did not settle for ${provider.uiName}: expected "0", got "${allowance}"`,
    );
  }
}
