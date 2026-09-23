import type { BigNumber } from "bignumber.js";
import { getCurrencyForAccount, type Account, type AccountLike } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";

type AffordabilityCheck = {
  account: AccountLike;
  parentAccount: Account | undefined;
  amount: BigNumber;
  feeStrategy: string;
  getAccountBridge?: typeof getAccountBridge;
};

export type SwapBalanceCheck = { checked: true } | { checked: false; reason: string };

const INSUFFICIENT_FUNDS_ERRORS = new Set([
  "NotEnoughBalance",
  "NotEnoughSpendableBalance",
  "NotEnoughBalanceBecauseDestinationNotCreated",
]);

const NON_BREAKING_SPACE = /\u00a0/g;

function formatAmount(account: AccountLike, value: BigNumber): string | undefined {
  const unit = getCurrencyForAccount(account).units[0];
  if (!unit) return undefined;
  const formatted = formatCurrencyUnit(unit, value, { showCode: true, disableRounding: true });
  return formatted.replace(NON_BREAKING_SPACE, " ");
}

function rewordForSwap(
  error: Error,
  {
    account,
    mainAccount,
    amount,
    fees,
  }: {
    account: AccountLike;
    mainAccount: Account;
    amount: BigNumber;
    fees: BigNumber;
  },
): Error {
  const swapAmount = formatAmount(account, amount);
  const networkFees = formatAmount(mainAccount, fees);
  const spendable = formatAmount(account, account.spendableBalance);
  if (!swapAmount || !networkFees || !spendable) return error;

  if (INSUFFICIENT_FUNDS_ERRORS.has(error.name)) {
    const feesPaidFromSameBalance = account.type === "Account";
    const spent = feesPaidFromSameBalance
      ? `${swapAmount} plus ${networkFees} network fees`
      : swapAmount;
    error.message = `Insufficient balance: swapping ${spent} exceeds the spendable ${spendable}.`;
  } else if (error.name === "NotEnoughGas") {
    error.message = `Not enough ${mainAccount.currency.ticker} to pay the ${networkFees} network fees for this swap.`;
  }
  return error;
}

/**
 * Throws the bridge's amount/fee error before any device or swap API call.
 * The payin address only exists after the swap API call, so the check sends to self and ignores `recipient` errors.
 */
export async function checkSwapAffordability({
  account,
  parentAccount,
  amount,
  feeStrategy,
  getAccountBridge: getBridge = getAccountBridge,
}: AffordabilityCheck): Promise<SwapBalanceCheck> {
  const mainAccount = getMainAccount(account, parentAccount);
  let status: Awaited<ReturnType<typeof selfTransferStatus>>;
  try {
    status = await selfTransferStatus(getBridge, mainAccount, {
      amount,
      recipient: mainAccount.freshAddress,
      feesStrategy: feeStrategy.toLowerCase(),
      ...(account.type === "Account" ? {} : { subAccountId: account.id }),
    });
  } catch (error) {
    return { checked: false, reason: error instanceof Error ? error.message : String(error) };
  }

  const errors: Record<string, Error> = status.errors;
  const blocking = Object.entries(errors).find(([field]) => field !== "recipient")?.[1];
  if (blocking) {
    throw rewordForSwap(blocking, { account, mainAccount, amount, fees: status.estimatedFees });
  }
  return { checked: true };
}

async function selfTransferStatus(
  getBridge: typeof getAccountBridge,
  mainAccount: Account,
  patch: Record<string, unknown>,
) {
  const bridge = await getBridge(mainAccount);
  const draft = bridge.updateTransaction(bridge.createTransaction(mainAccount), patch);
  const transaction = await bridge.prepareTransaction(mainAccount, draft);
  return bridge.getTransactionStatus(mainAccount, transaction);
}
