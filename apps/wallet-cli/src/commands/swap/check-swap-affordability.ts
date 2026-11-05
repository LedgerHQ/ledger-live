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

const INSUFFICIENT_FEE_FUNDS_ERRORS = new Set(["NotEnoughGas", "NotEnoughBalanceInParentAccount"]);

const BLOCKING_ERRORS = new Set([
  ...INSUFFICIENT_FUNDS_ERRORS,
  ...INSUFFICIENT_FEE_FUNDS_ERRORS,
  "DustLimit",
]);

const NON_BREAKING_SPACE = /\u00a0/g;

function formatAmount(account: AccountLike, value: BigNumber): string | undefined {
  const unit = getCurrencyForAccount(account).units[0];
  if (!unit) return undefined;
  const formatted = formatCurrencyUnit(unit, value, { showCode: true, disableRounding: true });
  return formatted.replaceAll(NON_BREAKING_SPACE, " ");
}

function describeNetworkFees(mainAccount: Account, fees: BigNumber | undefined) {
  if (!fees) return "network fees";
  const formatted = formatAmount(mainAccount, fees);
  return formatted && `${formatted} network fees`;
}

function withMessage(error: Error, message: string): Error {
  const reworded = Object.assign(new Error(message), error, { cause: error });
  return Object.setPrototypeOf(reworded, Object.getPrototypeOf(error));
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
    fees?: BigNumber;
  },
): Error {
  const swapAmount = formatAmount(account, amount);
  const networkFees = describeNetworkFees(mainAccount, fees);
  const spendable = formatAmount(account, account.spendableBalance);
  if (!swapAmount || !networkFees || !spendable) return error;

  if (INSUFFICIENT_FUNDS_ERRORS.has(error.name)) {
    const feesPaidFromSameBalance = account.type === "Account";
    const spent = feesPaidFromSameBalance ? `${swapAmount} plus ${networkFees}` : swapAmount;
    return withMessage(
      error,
      `Insufficient balance: swapping ${spent} exceeds the spendable ${spendable}.`,
    );
  }
  if (INSUFFICIENT_FEE_FUNDS_ERRORS.has(error.name)) {
    return withMessage(
      error,
      `Not enough ${mainAccount.currency.ticker} to pay the ${networkFees} for this swap.`,
    );
  }
  return error;
}

/**
 * Throws the bridge's shortfall error (funds, fee funds, dust) before any device or swap API call,
 * whether the bridge reports it in the transaction status or throws it while preparing the transaction.
 * Any other error, such as coin-evm's `FeeNotLoaded` when gas estimation fails, leaves the check inconclusive.
 * The payin address only exists after the swap API call, so the check sends to self and ignores `recipient` errors.
 * Fees are those of a plain transfer, lower than a DEX swap's or one with extra transaction parameters,
 * so `checked: true` only rules out clear-cut shortfalls.
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
    if (error instanceof Error && BLOCKING_ERRORS.has(error.name)) {
      throw rewordForSwap(error, { account, mainAccount, amount });
    }
    return { checked: false, reason: error instanceof Error ? error.message : String(error) };
  }

  const errors: Record<string, Error> = status.errors;
  const relevant = Object.entries(errors).filter(([field]) => field !== "recipient");
  const shortfall = relevant.find(([, error]) => BLOCKING_ERRORS.has(error.name))?.[1];
  if (shortfall) {
    throw rewordForSwap(shortfall, { account, mainAccount, amount, fees: status.estimatedFees });
  }
  const [inconclusive] = relevant;
  if (inconclusive) {
    const [field, error] = inconclusive;
    return { checked: false, reason: `${field}: ${error.message}` };
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
