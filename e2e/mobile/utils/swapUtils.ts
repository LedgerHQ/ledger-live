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
  minAmount: string;
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
  // Several assets share a ticker, so the account name is checked too.
  if (await app.swapLiveApp.isAccountSelected(account, isFromCurrency)) {
    return;
  }
  if (isFromCurrency) {
    await app.swapLiveApp.tapFromCurrency();
    await app.modularDrawer.selectAssetAndAccount(account);
    await app.swapLiveApp.checkAssetFromMatchesAccount(account);
  } else {
    await app.swapLiveApp.tapToCurrency();
    await app.modularDrawer.selectAssetAndAccount(account);
    await app.swapLiveApp.checkAssetToMatchesAccount(account);
  }
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
  const { fromAccount, provider, minAmount } = options;
  if (!needsTokenAllowance(fromAccount, provider)) return;
  const approvalNeeded = await isTokenApprovalExpected(options);
  if (!approvalNeeded) return;

  // A short allowance is revoked first, as USDT rejects a change from one non-zero allowance to another.
  await revokeTokenApproval(fromAccount, provider);
  await withTemporarySpeculos(fromAccount.currency.speculosApp.name, async () => {
    const result = await approveTokenCommand({
      account: fromAccount,
      spender: provider.contractAddress,
      approveAmount: new BigNumber(minAmount).times(12).div(10).toFixed(),
    });
    allure.descriptionHtml(
      `<p>Token approval result for ${escapeHtml(provider.uiName)}:</p><pre>${escapeHtml(result)}</pre>`,
    );
  });
}

export async function isTokenApprovalExpected(options: TokenApprovalOptions): Promise<boolean> {
  const { fromAccount, provider, minAmount } = options;
  if (!needsTokenAllowance(fromAccount, provider)) return false;

  const sufficientAllowance = await isTokenAllowanceSufficientCommand({
    account: fromAccount,
    spenderAddress: provider.contractAddress,
    minAmount,
  });
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
