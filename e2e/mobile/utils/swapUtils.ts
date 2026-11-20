import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { allure } from "jest-allure2-reporter/api";
import { floatNumberRegex } from "@ledgerhq/live-e2e-shared/data/regexes";
import BigNumber from "bignumber.js";
import { withTemporarySpeculos } from "@e2e/utils/speculosUtils";
import { revokeAllowance } from "@e2e/utils/allowanceUtils";
import { QUOTES_FETCH_TIMEOUT } from "@e2e/utils/constants";
import { escapeHtml } from "@e2e/helpers/allure/allure-helper";
import { needsTokenAllowance } from "@ledgerhq/live-e2e-shared/swap";

type SelectCurrencyOptions = {
  account: Account;
  isFromCurrency?: boolean;
};

type PerformSwapUntilQuoteSelectionStepOptions = {
  accountToDebit: Account;
  accountToCredit: Account;
  amount: string;
  continueToQuotes?: boolean;
};

type TokenApprovalOptions = {
  fromAccount: Account | TokenAccount;
  provider: SwapProvider;
  amount: string;
};

/**
 * Mirrors swap-live-app's remote-config decimal cap (currently defaults to 8, see
 * ptxSwapAppConfig / defaultAppConfig.decimals.default), not a device firmware limit.
 * Safe for currencies with <=8 native decimals (no-op). If that remote config value
 * ever changes, every caller of this helper would need updating together.
 */
export function truncateSwapAmount(amount: string): string {
  return new BigNumber(amount).decimalPlaces(8, BigNumber.ROUND_DOWN).toFixed();
}

async function selectCurrency(options: SelectCurrencyOptions) {
  const { account, isFromCurrency = true } = options;
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

  await app.modularDrawer.selectAsset(account);
  await app.swapLiveApp.verifyCurrencyIsSelected(account.currency.ticker, isFromCurrency);
}

export async function performSwapUntilQuoteSelectionStep(
  options: PerformSwapUntilQuoteSelectionStepOptions,
) {
  const { accountToDebit, accountToCredit, amount, continueToQuotes = true } = options;
  await selectCurrency({ account: accountToDebit, isFromCurrency: true });
  await selectCurrency({ account: accountToCredit, isFromCurrency: false });
  await app.swapLiveApp.inputAmount(amount);
  if (continueToQuotes) {
    await app.swapLiveApp.waitForAmountToReceive(floatNumberRegex, QUOTES_FETCH_TIMEOUT);
    await app.swapLiveApp.tapGetQuotesButton();
    await app.swapLiveApp.waitForQuotes();
  }
}
export async function ensureTokenApproval(options: TokenApprovalOptions) {
  const { fromAccount, provider, amount } = options;
  if (!needsTokenAllowance(fromAccount, provider)) return;
  const approvalNeeded = await isTokenApprovalExpected(options);
  if (!approvalNeeded) return;

  // A short allowance is revoked first, as USDT rejects a change from one non-zero allowance to another.
  await revokeTokenApproval(fromAccount, provider);
  await withTemporarySpeculos(fromAccount.currency.speculosApp.name, async () => {
    const result = await approveTokenCommand(
      fromAccount,
      provider.contractAddress,
      new BigNumber(amount).times(12).div(10).toFixed(),
    );
    allure.descriptionHtml(
      `<p>Token approval result for ${escapeHtml(provider.uiName)}:</p><pre>${escapeHtml(result)}</pre>`,
    );
  });
}

export async function isTokenApprovalExpected(options: TokenApprovalOptions): Promise<boolean> {
  const { fromAccount, provider, amount } = options;
  if (!needsTokenAllowance(fromAccount, provider)) return false;

  const sufficientAllowance = await isTokenAllowanceSufficientCommand(
    fromAccount,
    provider.contractAddress,
    amount,
  );
  return !sufficientAllowance;
}

export async function revokeTokenApproval(
  fromAccount: Account | TokenAccount,
  provider: SwapProvider,
) {
  if (!needsTokenAllowance(fromAccount, provider)) return;

  await revokeAllowance({
    account: fromAccount,
    spender: provider.contractAddress,
    label: provider.uiName,
  });
}
