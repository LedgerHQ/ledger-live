import BigNumber from "bignumber.js";
import type { Account, AccountLike, SwapOperation } from "@ledgerhq/types-live";
import { TransactionStatus } from "@ledgerhq/wallet-api-exchange-module";
import { getAccountCurrency } from "../../../account";
import { PERPS_SWAPKIT_PROVIDER } from "../constants";
import { PERPS_WITHDRAW_HYPERLIQUID_FEE_USDC } from "./constants";

export type PerpsWithdrawSwapOperationParams = Readonly<{
  swapId: string;
  /** The HyperCore account. */
  sourceAccount: AccountLike;
  destinationAccount: AccountLike;
  /** In the source account unit, excluding the Hyperliquid fee. */
  amountFrom: BigNumber;
  /** In the destination account unit. */
  amountTo: BigNumber;
  /** The quote network fees taken from the payout, in the destination account unit. */
  payoutNetworkFees: BigNumber;
}>;

const toAtomic = (account: AccountLike, amount: BigNumber): BigNumber =>
  amount
    .shiftedBy(getAccountCurrency(account).units[0].magnitude)
    .integerValue(BigNumber.ROUND_DOWN);

/**
 * The HyperCore account has no operation for a withdraw, so the swap history entry is kept on the
 * destination account instead. It has no operation id until the swap status returns the payout tx
 * hash, and stays out of the swap history until then.
 */
export function createPerpsWithdrawSwapOperation({
  swapId,
  sourceAccount,
  destinationAccount,
  amountFrom,
  amountTo,
  payoutNetworkFees,
}: PerpsWithdrawSwapOperationParams): SwapOperation {
  return {
    provider: PERPS_SWAPKIT_PROVIDER,
    swapId,
    status: TransactionStatus.Pending,
    receiverAccountId: destinationAccount.id,
    fromAccountId: sourceAccount.id,
    operationId: "",
    fromAmount: toAtomic(sourceAccount, amountFrom),
    toAmount: toAtomic(destinationAccount, amountTo),
    feesAmount: toAtomic(sourceAccount, PERPS_WITHDRAW_HYPERLIQUID_FEE_USDC).toFixed(),
    ...(!payoutNetworkFees.isZero() && {
      payoutFeesAmount: toAtomic(destinationAccount, payoutNetworkFees).toFixed(),
    }),
    createdAt: Date.now(),
  };
}

/**
 * Adds the entry to the account it is received on: the main account itself or one of its token
 * accounts. A token account the user never held is not among the token accounts yet: the
 * `destinationAccount` picked in the form is then added with the entry. Adding the same swap twice
 * keeps a single entry.
 */
export function addPerpsWithdrawToSwapHistory(
  account: Account,
  swapOperation: SwapOperation,
  destinationAccount?: AccountLike,
): Account {
  const { receiverAccountId, swapId } = swapOperation;
  const withEntry = <T extends { swapHistory: SwapOperation[] }>(holder: T): T =>
    holder.swapHistory.some(entry => entry.swapId === swapId)
      ? holder
      : { ...holder, swapHistory: [...holder.swapHistory, swapOperation] };

  if (account.id === receiverAccountId) return withEntry(account);
  const subAccounts = account.subAccounts ?? [];
  if (subAccounts.some(subAccount => subAccount.id === receiverAccountId)) {
    return {
      ...account,
      subAccounts: subAccounts.map(subAccount =>
        subAccount.id === receiverAccountId ? withEntry(subAccount) : subAccount,
      ),
    };
  }
  if (
    destinationAccount?.type === "TokenAccount" &&
    destinationAccount.id === receiverAccountId &&
    destinationAccount.parentId === account.id
  ) {
    return { ...account, subAccounts: [...subAccounts, withEntry(destinationAccount)] };
  }
  return account;
}

/**
 * The account update recording a submitted withdraw in the swap history, for the apps to dispatch
 * with `updateAccountWithUpdater`.
 */
export function getPerpsWithdrawHistoryUpdate(
  params: PerpsWithdrawSwapOperationParams,
): Readonly<{ accountId: string; updater: (account: Account) => Account }> {
  const { destinationAccount } = params;
  const swapOperation = createPerpsWithdrawSwapOperation(params);
  return {
    accountId:
      destinationAccount.type === "TokenAccount"
        ? destinationAccount.parentId
        : destinationAccount.id,
    updater: account => addPerpsWithdrawToSwapHistory(account, swapOperation, destinationAccount),
  };
}
