import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { FETCH_TXNS_LIMIT } from "../consts";
import { fetchTxnsPage } from "../network/api";
import type { TransactionWithId } from "../network/idl/index.types";
import { NATIVE_ASSET } from "./getBalance";
import { getBlockInfo } from "./getBlockInfo";
import { hashTransaction } from "./hashTransaction";

const NANOS_PER_MILLI = 1_000_000n;
const CURSOR_PATTERN = /^\d+$/;

/**
 * The transaction's block time as the index reports it. `created_at_time` is no substitute: the
 * sender sets it, and the ledger accepts it up to a day before the block.
 */
export function indexedBlockTime({ transaction }: TransactionWithId): Date | undefined {
  const nanos = transaction.timestamp[0]?.timestamp_nanos;
  return nanos === undefined ? undefined : new Date(Number(nanos / NANOS_PER_MILLI));
}

/**
 * The operations a ledger transaction makes for `address`: OUT when it sends, IN when it receives,
 * both for a transfer to itself. Only transfers move funds between accounts; mints, burns and
 * approvals yield none, as in the account bridge.
 *
 * The value is the transferred amount alone: the generic framework adds `tx.fees` to an outgoing
 * native operation itself.
 */
export function toOperations(txInfo: TransactionWithId, address: string, date: Date): Operation[] {
  const { transaction } = txInfo;
  if (!("Transfer" in transaction.operation)) return [];

  const { from, to, amount, fee } = transaction.operation.Transfer;
  const hash = hashTransaction({
    from,
    to,
    amount: amount.e8s,
    fee: fee.e8s,
    memo: transaction.memo,
    created_at_time: transaction.created_at_time[0]?.timestamp_nanos ?? 0n,
  });
  const memo = transaction.memo.toString();

  const toOperation = (type: "IN" | "OUT"): Operation => ({
    id: `${hash}-${type}`,
    type,
    senders: [from],
    recipients: [to],
    value: amount.e8s,
    asset: NATIVE_ASSET,
    // The generic framework reads the memo from `details`; `Operation` carries no typed memo.
    details: { memo },
    tx: {
      hash,
      // The index canister gives the block height but not its hash.
      block: { height: Number(txInfo.id), hash: "", time: date },
      fees: fee.e8s,
      feesPayer: from,
      date,
      // The ledger records only transfers that succeeded.
      failed: false,
    },
  });

  // The index answers in lowercase hex; an identifier is valid in either case.
  const self = address.toLowerCase();
  return [
    ...(from === self ? [toOperation("OUT")] : []),
    ...(to === self ? [toOperation("IN")] : []),
  ];
}

/**
 * One page of the account's history, newest first. The cursor is the id of the last transaction
 * returned, which the index canister resumes after, so it stays valid indefinitely. The index
 * serves newest-first only, so ascending order is not supported.
 */
export async function listOperations(
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation>> {
  if (options.order === "asc") throw new Error("ascending order is not supported");
  if (options.cursor !== undefined && !CURSOR_PATTERN.test(options.cursor)) {
    throw new Error(`[ICP](listOperations) Invalid cursor: ${options.cursor}`);
  }

  // `limit` is a soft limit by contract, so it is clamped to what one index query serves.
  // It is also rounded down: the index takes a whole number of transactions.
  const limit = Math.min(
    Math.max(Math.floor(options.limit ?? FETCH_TXNS_LIMIT), 1),
    FETCH_TXNS_LIMIT,
  );
  const start = options.cursor === undefined ? undefined : BigInt(options.cursor);
  const { transactions, oldestTxId } = await fetchTxnsPage(address.toLowerCase(), start, limit);

  const minHeight = BigInt(options.minHeight || 0);
  // Pages run newest-first, so a transaction below the floor means every later one is too.
  const reachedFloor = transactions.some(({ id }) => id < minHeight);
  const kept = transactions.filter(({ id }) => id >= minHeight);
  // A transaction without an indexed time takes its block's time from the ledger.
  const dates = await Promise.all(
    kept.map(
      async txInfo => indexedBlockTime(txInfo) ?? (await getBlockInfo(Number(txInfo.id))).time,
    ),
  );
  const items = kept.flatMap((txInfo, i) => toOperations(txInfo, address, dates[i]));

  const last = transactions.at(-1);
  const exhausted = reachedFloor || last === undefined || last.id === oldestTxId;
  return { items, next: exhausted ? undefined : last.id.toString() };
}
