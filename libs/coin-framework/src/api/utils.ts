import {
  AccountTransaction,
  BalanceDelta,
  Cursor,
  Direction,
  Memo,
  Operation,
  Page,
  Pagination,
} from "./types";

type ListOperations<MemoType extends Memo> = (
  address: string,
  pagination: Pagination,
) => Promise<[Operation<MemoType>[], string]>;

type GetTransactions<MemoType extends Memo> = (
  address: string,
  direction?: Direction,
  minHeight?: number,
  maxHeight?: number,
  cursor?: Cursor,
) => Promise<Page<AccountTransaction<MemoType>>>;

/**
 * Adapt a {@link AlpacaApi#getTransactions} implementation to a {@link AlpacaApi#listOperations} one.
 *
 * This method is provided for backward compatibility, until all coins have been updated to provide
 * {@link AlpacaApi#getTransactions} and all clients updated to use it.
 *
 * @param getTransactions the {@link AlpacaApi#getTransactions} implementation to adapt
 */
export function toListOperations<MemoType extends Memo>(
  getTransactions: GetTransactions<MemoType>,
): ListOperations<MemoType> {
  // TODO
  throw new Error("Not implemented");
}

/**
 * In most cases, blockchain API/RPCs return the balance changes for a transaction including the impact of paying fees.
 * In our APIs, we keep fees separate from other balance changes occurring in the same transaction. This function
 * subtracts the fees from the balance changes.
 *
 * Note that behavior is undefined if provided deltas do not cover provided fees (eg: no delta for a given fee).
 *
 * @param deltas transaction balance deltas, including fees
 * @param fees fees balance deltas
 * @returns balance transaction deltas excluding fees
 */
export function deduceFees(deltas: BalanceDelta[], fees: BalanceDelta[]): BalanceDelta[] {
  const remainingFees = [...fees];

  const result: BalanceDelta[] = [];
  for (const delta of deltas) {
    const fee = remainingFees.find(d => d.address === delta.address && d.asset === delta.asset);
    if (fee !== undefined) {
      result.push({ ...delta, delta: delta.delta - fee.delta });
      remainingFees.splice(remainingFees.indexOf(fee), 1);
    } else {
      result.push(delta);
    }
  }

  return result;
}
