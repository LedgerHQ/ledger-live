import { BigNumber } from "bignumber.js";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { getPendingTokenSpent } from "../../../bridge/generic-coin-framework/utils";
import type {
  RentPayment,
  SponsoredFeeAsset,
} from "../../../bridge/generic-coin-framework/sponsored";
import { formatFeeCurrencyAmount } from "../utils/networkFeesDisplay";

export function formatRentPayment(payment: RentPayment, locale: string): string | null {
  const { unit } = payment.asset;
  if (!unit) return null;
  return formatFeeCurrencyAmount(unit, new BigNumber(payment.amount.toString()), locale);
}

/** The sub-account holding the token a sponsored fee is paid in; null for a native fee asset. */
export function findFeeTokenAccount(
  mainAccount: Account | null,
  feeAsset: SponsoredFeeAsset | null,
): TokenAccount | null {
  if (!mainAccount || !feeAsset || !("assetReference" in feeAsset) || !feeAsset.assetReference) {
    return null;
  }
  const { assetReference } = feeAsset;
  return mainAccount.subAccounts?.find(sub => sub.token.contractAddress === assetReference) ?? null;
}

/** Mirrors prepareTransaction's token max: spendable net of unsynced outgoing ops. */
export function tokenSpendableAfterPending(tokenAccount: TokenAccount): BigNumber {
  return BigNumber.max(
    0,
    tokenAccount.spendableBalance.minus(getPendingTokenSpent(tokenAccount.pendingOperations ?? [])),
  );
}

export function isSponsoredFeeUnaffordable({
  account,
  transaction,
  feeTokenAccount,
  rentValue,
}: {
  account: AccountLike;
  transaction: { amount: BigNumber; useAllAmount?: boolean };
  feeTokenAccount: TokenAccount | null;
  rentValue: bigint;
}): boolean {
  if (!feeTokenAccount) return true;
  const spendable = tokenSpendableAfterPending(feeTokenAccount);
  const rent = new BigNumber(rentValue.toString());
  if (account.id !== feeTokenAccount.id) return spendable.lt(rent);
  // A Max send spends the whole balance, so nothing is left for the rent.
  const amount = transaction.useAllAmount ? spendable : transaction.amount;
  return spendable.lt(amount.plus(rent));
}

/** Largest amount that leaves the rent plus a 1% margin, so an order priced slightly above the
 * quote still fits the balance. ≤ 0 means no amount fits. */
export function sponsoredMaxAmount(feeTokenAccount: TokenAccount, rentValue: bigint): BigNumber {
  const rent = new BigNumber(rentValue.toString());
  return tokenSpendableAfterPending(feeTokenAccount)
    .minus(rent)
    .minus(rent.div(100).integerValue(BigNumber.ROUND_CEIL));
}
