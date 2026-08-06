import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { Unit } from "@ledgerhq/ledger-wallet-framework/types";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { fetchTxsPage } from "../network/api";
import { ITxnHistoryData } from "../types/network";
import { CasperOperation } from "../types";
import { getEstimatedFees } from "./estimateFees";
import { casperAccountHashFromPublicKey } from "./validateAddress";

export const getUnit = (): Unit => getCryptoCurrencyById("casper").units[0];

/**
 * The indexer offers no filtering and only page-index pagination, and page indexes shift as new
 * deploys arrive. The cursor therefore records the *content* boundary it stopped at, which stays
 * valid indefinitely, and carries the page it was seen on only as a hint.
 */
type ListOperationsCursor = {
  blockHeight: number;
  deployHash: string;
  /** Optimisation only — correctness never depends on it, see `resumePageIsSafe`. */
  page?: number;
};

function encodeCursor(record: ITxnHistoryData, page: number): string {
  return JSON.stringify({
    blockHeight: record.block_height,
    deployHash: record.deploy_hash,
    page,
  } satisfies ListOperationsCursor);
}

/** Malformed cursors are ignored rather than thrown, so a stale client cannot wedge a sync. */
function parseCursor(token?: string): ListOperationsCursor | undefined {
  if (!token) return undefined;
  try {
    const parsed: unknown = JSON.parse(token);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const { blockHeight, deployHash, page } = parsed as Record<string, unknown>;
    if (typeof blockHeight !== "number" || !Number.isFinite(blockHeight)) return undefined;
    if (typeof deployHash !== "string" || deployHash.length === 0) return undefined;
    return {
      blockHeight,
      deployHash,
      ...(typeof page === "number" && Number.isInteger(page) && page > 0 && { page }),
    };
  } catch {
    return undefined;
  }
}

function resolveParties(tx: ITxnHistoryData): { fromAccount: string; toAccount: string } {
  // `caller_hash` is the indexer's own derivation and matches blake2b256(caller_public_key);
  // the fallback covers records that predate the field.
  const fromAccount = tx.caller_hash || casperAccountHashFromPublicKey(tx.caller_public_key);
  // `target` is a raw account hash for `{ ByteArray: 32 }`, and a public key for "PublicKey".
  const toAccount =
    tx.args.target.cl_type === "PublicKey"
      ? casperAccountHashFromPublicKey(tx.args.target.parsed)
      : tx.args.target.parsed;

  invariant(toAccount, "toAccount is required");
  invariant(fromAccount, "fromAccount is required");

  return { fromAccount, toAccount };
}

/**
 * For transfers sent without a transfer id the indexer either omits the `id` arg entirely or
 * returns it with a `null` value.
 */
function resolveTransferId(tx: ITxnHistoryData): string | undefined {
  return tx.args.id?.parsed?.toString();
}

/**
 * Map one indexer record to the Alpaca operations it produces for `accountHash`.
 *
 * A self-transfer legitimately yields both an OUT and an IN, matching the legacy model.
 * A record we cannot map is dropped with a warning so one bad row cannot blank a whole history.
 */
export function mapTxToCoreOps(tx: ITxnHistoryData, accountHash: string): Operation[] {
  try {
    const { fromAccount, toAccount } = resolveParties(tx);
    const date = new Date(tx.timestamp);
    const transferId = resolveTransferId(tx);

    const buildOp = (type: "OUT" | "IN"): Operation => ({
      id: `${tx.deploy_hash}-${type}`,
      type,
      senders: [fromAccount],
      recipients: [toAccount],
      // The amount alone — the fee lives in `tx.fees`, so adding it here would double-count it.
      value: BigInt(tx.args.amount.parsed),
      asset: { type: "native" },
      details: {
        status: tx.status,
        consumedGas: tx.consumed_gas,
        paymentAmount: tx.payment_amount,
        refundAmount: tx.refund_amount,
        // The framework types `listOperations` as returning a bare `Operation`, whose `memo` is
        // `MemoNotSupported`, so the transfer id is surfaced here instead.
        ...(transferId !== undefined && { transferId }),
      },
      tx: {
        hash: tx.deploy_hash,
        block: { height: tx.block_height, hash: tx.block_hash, time: date },
        // The actual charge for this deploy, not the flat fee estimate.
        fees: BigInt(tx.cost),
        feesPayer: fromAccount,
        date,
        failed: Boolean(tx.error_message),
      },
    });

    const ops: Operation[] = [];
    if (accountHash.toLowerCase() === fromAccount.toLowerCase()) ops.push(buildOp("OUT"));
    if (accountHash.toLowerCase() === toAccount.toLowerCase()) ops.push(buildOp("IN"));
    return ops;
  } catch (err) {
    log("warn", "casper: skipping unmappable indexer record", err);
    return [];
  }
}

/**
 * A hinted resume page is only safe if it has not drifted *past* the boundary — otherwise records
 * between the boundary and this page would be skipped, so we restart from page 1.
 */
function resumePageIsSafe(records: ITxnHistoryData[], boundary: ListOperationsCursor): boolean {
  const first = records[0];
  return first !== undefined && first.block_height >= boundary.blockHeight;
}

/**
 * List an account's native CSPR operations, newest first.
 *
 * Only native transfers are returned. CEP-18 is not onboarded in crypto-assets (casper has
 * `has_tokens=False`), and no staking operation has been observed on this endpoint.
 *
 * Option support, given an indexer with no filtering, a fixed 10-record page and descending order:
 * - `minHeight` is honoured, and terminates paging early since records arrive newest first.
 * - `limit` is honoured as the soft limit the contract describes — a whole page is always consumed,
 *   so slightly more than `limit` operations may come back.
 * - `order` only supports "desc"; "asc" raises, as the indexer cannot serve it without downloading
 *   the account's entire history.
 */
export async function listOperations(
  address: string,
  { minHeight, cursor, limit, order }: ListOperationsOptions,
): Promise<Page<Operation>> {
  if (order !== undefined && order !== "desc") {
    throw new Error(`casper: listOperations order "${order}" is not supported`);
  }

  const accountHash = casperAccountHashFromPublicKey(address);
  const boundary = parseCursor(cursor);

  const items: Operation[] = [];
  let page = boundary?.page ?? 1;
  let resumeChecked = page === 1 || boundary === undefined;
  // Everything is returned until the cursor's record is passed.
  let pastBoundary = boundary === undefined;
  let lastRecord: ITxnHistoryData | undefined;
  let lastPage = page;
  let belowMinHeight = false;
  let morePages = false;

  for (;;) {
    const response = await fetchTxsPage(address, page);
    const records = response.data;

    if (!resumeChecked && boundary !== undefined) {
      resumeChecked = true;
      if (records.length === 0 || !resumePageIsSafe(records, boundary)) {
        log("warn", "casper: listOperations resume hint drifted, restarting from page 1", {
          hintedPage: page,
        });
        page = 1;
        continue;
      }
    }

    if (records.length === 0) break;

    for (const record of records) {
      if (!pastBoundary && boundary !== undefined) {
        if (record.deploy_hash === boundary.deployHash) {
          pastBoundary = true;
          continue;
        }
        // The boundary record itself is gone — resume from the first strictly older record.
        if (record.block_height >= boundary.blockHeight) continue;
        pastBoundary = true;
      }

      if (record.block_height < minHeight) {
        belowMinHeight = true;
        break;
      }

      items.push(...mapTxToCoreOps(record, accountHash));
      // Advanced even for unmappable records, so a bad row cannot stall the cursor.
      lastRecord = record;
      lastPage = page;
    }

    if (belowMinHeight) break;
    if (page >= response.page_count) break;
    if (limit !== undefined && items.length >= limit) {
      morePages = true;
      break;
    }
    page++;
  }

  // Nothing is left to page through once minHeight is crossed or the last page is consumed.
  const next = morePages && lastRecord ? encodeCursor(lastRecord, lastPage) : undefined;

  return { items, ...(next !== undefined && { next }) };
}

export function mapTxToOps(
  accountId: string,
  addressHash: string,
  fees = getEstimatedFees(),
): (tx: ITxnHistoryData) => CasperOperation[] {
  return (tx: ITxnHistoryData): CasperOperation[] => {
    try {
      const ops: CasperOperation[] = [];
      const { timestamp, deploy_hash, error_message } = tx;
      const { fromAccount, toAccount } = resolveParties(tx);

      const date = new Date(timestamp);
      const value = new BigNumber(tx.args.amount.parsed);
      const feeToUse = fees;

      const isSending = addressHash.toLowerCase() === fromAccount.toLowerCase();
      const isReceiving = addressHash.toLowerCase() === toAccount.toLowerCase();

      const transferId = resolveTransferId(tx);

      if (isSending) {
        ops.push({
          id: encodeOperationId(accountId, deploy_hash, "OUT"),
          hash: deploy_hash,
          type: "OUT",
          value: value.plus(feeToUse),
          fee: feeToUse,
          blockHeight: 1,
          hasFailed: Boolean(error_message),
          blockHash: null,
          accountId,
          senders: [fromAccount],
          recipients: [toAccount],
          date,
          extra: {
            ...(transferId !== undefined && { transferId }),
          },
        });
      }

      if (isReceiving) {
        ops.push({
          id: encodeOperationId(accountId, deploy_hash, "IN"),
          hash: deploy_hash,
          type: "IN",
          value,
          fee: feeToUse,
          blockHeight: 1,
          blockHash: null,
          hasFailed: Boolean(error_message),
          accountId,
          senders: [fromAccount],
          recipients: [toAccount],
          date,
          extra: {
            ...(transferId !== undefined && { transferId }),
          },
        });
      }

      return ops;
    } catch (err) {
      log("warn", `mapTxToOps failed for casper, skipping operation`, err);
      return [];
    }
  };
}
