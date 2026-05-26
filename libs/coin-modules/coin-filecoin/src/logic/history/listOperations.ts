import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { fetchERC20Transactions, fetchTxs } from "../../api/api";
import { TransactionResponse, ERC20Transfer, TxStatus } from "../../types";

/**
 * Cursor format: base64-encoded JSON string `{ offset: number, lastHeight: number }`.
 * The cursor is stable across requests for the same minHeight value.
 */
type CursorData = {
  offset: number;
  lastHeight: number;
};

function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

function decodeCursor(cursor: string): CursorData {
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8")) as CursorData;
  } catch {
    return { offset: 0, lastHeight: 0 };
  }
}

const DEFAULT_PAGE_LIMIT = 50;

/**
 * Maps a native Filecoin transaction to Operation(s).
 *
 * - OUT value = amount + fees (total balance deduction)
 * - IN value = amount only
 * - FEES type emitted when value is 0 but fees were paid (e.g., contract calls)
 * - operationIndex ensures uniqueness within a transaction hash
 */
function mapNativeTxToOperation(
  tx: TransactionResponse,
  address: string,
  operationIndex: number,
): Operation[] {
  const { to, from, hash, timestamp, amount, fee_data, height, status } = tx;

  const ops: Operation[] = [];
  const date = new Date(timestamp * 1000);
  const value = BigInt(amount);
  const feeValue = BigInt(fee_data?.TotalCost ?? "0");
  const hasFailed = status !== TxStatus.Ok;

  const block = {
    height,
    hash,
    time: date,
  };

  const isSending = address === from;
  const isReceiving = address === to;

  if (isSending) {
    const type = value === 0n ? "FEES" : "OUT";
    ops.push({
      id: `${hash}-${type}-${operationIndex}`,
      type,
      asset: { type: "native" },
      value: value + feeValue,
      senders: [from],
      recipients: [to],
      tx: {
        hash,
        fees: feeValue,
        date,
        failed: hasFailed,
        block,
      },
    });
  }

  if (isReceiving && !isSending) {
    const type = value === 0n ? "FEES" : "IN";
    ops.push({
      id: `${hash}-${type}-${operationIndex}`,
      type,
      asset: { type: "native" },
      value,
      senders: [from],
      recipients: [to],
      tx: {
        hash,
        fees: feeValue,
        date,
        failed: hasFailed,
        block,
      },
    });
  }

  return ops;
}

/**
 * Maps an ERC-20 transfer to Operation(s).
 *
 * - assetReference is normalized to lowercase for consistency across balance/history
 * - fees are always 0 for the token operation (native fee is on the parent tx)
 * - operationIndex ensures uniqueness across native + token ops in the same tx
 */
function mapERC20TxToOperation(
  tx: ERC20Transfer,
  address: string,
  operationIndex: number,
): Operation[] {
  try {
    const { to, from, amount, tx_hash, tx_cid, height, timestamp, contract_address, status } = tx;

    const ops: Operation[] = [];
    const date = new Date(timestamp * 1000);
    const value = BigInt(amount);
    const hasFailed = status !== TxStatus.Ok;
    const hash = tx_cid ?? tx_hash;
    // Normalize contract address to lowercase for consistency (Fix #4)
    const canonicalContract = contract_address.toLowerCase();

    const block = {
      height,
      hash,
      time: date,
    };

    const isSending = address.toLowerCase() === from.toLowerCase();
    const isReceiving = address.toLowerCase() === to.toLowerCase();

    if (isSending) {
      ops.push({
        id: `${hash}-OUT-${operationIndex}`,
        type: "OUT",
        asset: { type: "token", assetReference: canonicalContract },
        value,
        senders: [from],
        recipients: [to],
        tx: {
          hash,
          fees: 0n,
          date,
          failed: hasFailed,
          block,
        },
      });
    }

    if (isReceiving && !isSending) {
      ops.push({
        id: `${hash}-IN-${operationIndex}`,
        type: "IN",
        asset: { type: "token", assetReference: canonicalContract },
        value,
        senders: [from],
        recipients: [to],
        tx: {
          hash,
          fees: 0n,
          date,
          failed: hasFailed,
          block,
        },
      });
    }

    return ops;
  } catch {
    return [];
  }
}

/**
 * Returns a page of operations for an address.
 *
 * Fetches both native FIL transfers and ERC-20 token transfers, merges them,
 * and returns them sorted by block height (descending).
 *
 * Pagination is cursor-based. The cursor encodes the current offset and the
 * minHeight used, so it remains stable across requests for the same minHeight.
 *
 * Each operation has a unique `id` using an `operationIndex` to prevent
 * collisions when multiple operations share the same transaction hash.
 */
export async function listOperations(
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation>> {
  const { minHeight, cursor, limit = DEFAULT_PAGE_LIMIT } = options;

  const { offset: currentOffset, lastHeight: cursorHeight } = cursor
    ? decodeCursor(cursor)
    : { offset: 0, lastHeight: minHeight };

  const fromHeight = cursor ? cursorHeight : minHeight;

  const [nativeResponse, erc20Response] = await Promise.all([
    fetchTxs(address, fromHeight, currentOffset, limit),
    fetchERC20Transactions(address, fromHeight, currentOffset, limit),
  ]);

  // Map with globally unique operationIndex across both streams (Fix #2)
  let opIndex = 0;

  const nativeOps = nativeResponse.txs.flatMap(tx => {
    const ops = mapNativeTxToOperation(tx, address, opIndex);
    opIndex++;
    return ops;
  });

  const erc20Ops = erc20Response.txs.flatMap(tx => {
    const ops = mapERC20TxToOperation(tx, address, opIndex);
    opIndex++;
    return ops;
  });

  const allOps = [...nativeOps, ...erc20Ops].sort(
    (a, b) => b.tx.block.height - a.tx.block.height,
  );

  // Fix #6: either stream having a full page means there may be more data
  const nativeCount = nativeResponse.txs.length;
  const erc20Count = erc20Response.txs.length;
  const hasMore = nativeCount >= limit || erc20Count >= limit;

  const nextCursor = hasMore
    ? encodeCursor({ offset: currentOffset + limit, lastHeight: fromHeight })
    : undefined;

  return {
    items: allOps,
    next: nextCursor,
  };
}
