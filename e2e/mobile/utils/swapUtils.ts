import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { allure } from "jest-allure2-reporter/api";
import { floatNumberRegex } from "@ledgerhq/live-e2e-shared/data/regexes";
import { getEnv } from "@ledgerhq/live-env";
import BigNumber from "bignumber.js";
import { deleteSpeculos, launchSpeculos, registerSpeculos } from "./speculosUtils";
import { log } from "detox";

/**
 * Mirrors swap-live-app's remote-config decimal cap (currently defaults to 8, see
 * ptxSwapAppConfig / defaultAppConfig.decimals.default), not a device firmware limit.
 * Safe for currencies with <=8 native decimals (no-op). If that remote config value
 * ever changes, every caller of this helper would need updating together.
 */
export function truncateSwapAmount(amount: string): string {
  return new BigNumber(amount).decimalPlaces(8, BigNumber.ROUND_DOWN).toFixed();
}

async function selectCurrency(
  account: Account,
  isFromCurrency: boolean = true,
  selectSpecificAccount: boolean = false,
) {
  // Check the appropriate field based on whether we're selecting FROM or TO
  const currentCurrencyText = isFromCurrency
    ? await app.swapLiveApp.getFromCurrencyTexts()
    : await app.swapLiveApp.getToCurrencyTexts();

  // When a specific (non-default) account is required, always open the drawer to pick it —
  // even if the currency already matches — otherwise the default first account is kept.
  if (!selectSpecificAccount && currentCurrencyText.includes(account.currency.ticker)) {
    return;
  }
  if (isFromCurrency) {
    await app.swapLiveApp.tapFromCurrency();
  } else {
    await app.swapLiveApp.tapToCurrency();
  }

  if (selectSpecificAccount) {
    await app.modularDrawer.selectAssetAndAccount(account);
  } else {
    await app.modularDrawer.selectAsset(account);
  }
  await app.swapLiveApp.verifyCurrencyIsSelected(account.currency.ticker, isFromCurrency);
}

export async function performSwapUntilQuoteSelectionStep(
  accountToDebit: Account,
  accountToCredit: Account,
  amount: string,
  continueToQuotes: boolean = true,
  selectSpecificToAccount: boolean = false,
) {
  await selectCurrency(accountToDebit, true);
  await selectCurrency(accountToCredit, false, selectSpecificToAccount);
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
    allure.description(`Token approval result for ${provider.uiName}:\n\n ${result}`);
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
      allure.description(`Token revoke result for ${provider.uiName}:\n\n ${result}`);
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
