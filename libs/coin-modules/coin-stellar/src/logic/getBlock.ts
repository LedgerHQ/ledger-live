import type {
  AssetInfo,
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import { fetchAllLedgerOperations, fetchLedgerRecord } from "../network";
import type { RawOperation } from "../types";
import { parseAPIValue } from "./common";
import { assertUnreachable } from "./utils";
import BigNumber from "bignumber.js";

const NATIVE_ASSET: AssetInfo = { type: "native", name: "XLM" };

/**
 * Horizon `type` strings that `getBlock` maps into `BlockOperation` entries.
 *
 * Same subset as user-facing history in `rawOperationsToOperations` (serialization);
 * other operation kinds are ignored until a later iteration expands coverage.
 */
const SUPPORTED_GETBLOCK_OP_TYPES = new Set<string>([
  "create_account",
  "payment",
  "path_payment_strict_send",
  "path_payment_strict_receive",
  "change_trust",
]);

type RawPathStrictSendOp = Extract<RawOperation, { type: "path_payment_strict_send" }>;
type RawPathStrictReceiveOp = Extract<RawOperation, { type: "path_payment_strict_receive" }> & {
  send_max?: string;
};

/** Horizon ops mapped by `getBlock`; kept in sync with `SUPPORTED_GETBLOCK_OP_TYPES`. */
type SupportedGetBlockOperation = Extract<
  RawOperation,
  | { type: "payment" }
  | { type: "create_account" }
  | { type: "change_trust" }
  | { type: "path_payment_strict_send" }
  | { type: "path_payment_strict_receive" }
>;

function pathStrictDualLegTransfers(params: {
  fromAddr: string | undefined;
  toAddr: string | undefined;
  sourceAsset: AssetInfo;
  destAsset: AssetInfo;
  sourceStroops: bigint;
  destStroops: bigint;
}): BlockOperation[] {
  const { fromAddr, toAddr, sourceAsset, destAsset, sourceStroops, destStroops } = params;
  const ops: BlockOperation[] = [];
  if (fromAddr && sourceStroops !== 0n) {
    ops.push({
      type: "transfer",
      address: fromAddr,
      ...(toAddr && { peer: toAddr }),
      asset: sourceAsset,
      amount: -sourceStroops,
    });
  }
  if (toAddr && destStroops !== 0n) {
    ops.push({
      type: "transfer",
      address: toAddr,
      ...(fromAddr && { peer: fromAddr }),
      asset: destAsset,
      amount: destStroops,
    });
  }
  return ops;
}

function toStroops(amountStr: string | undefined): bigint {
  if (!amountStr) {
    return 0n;
  }
  return BigInt(parseAPIValue(amountStr).integerValue(BigNumber.ROUND_FLOOR).toFixed(0));
}

function assetFromHorizonFields(
  assetType: string | undefined,
  assetCode: string | undefined,
  assetIssuer: string | undefined,
): AssetInfo {
  if (!assetType || assetType === "native") {
    return NATIVE_ASSET;
  }
  return {
    type: "token",
    assetReference: assetCode ?? "",
    assetOwner: assetIssuer ?? "",
  };
}

function isSupportedGetBlockOperation(op: RawOperation): op is SupportedGetBlockOperation {
  return SUPPORTED_GETBLOCK_OP_TYPES.has(op.type);
}

function orderTransactionHashes(rawOps: RawOperation[]): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  for (const op of rawOps) {
    const h = op.transaction_hash;
    if (!seen.has(h)) {
      seen.add(h);
      order.push(h);
    }
  }
  return order;
}

function groupOpsByHash(rawOps: RawOperation[]): Map<string, RawOperation[]> {
  const map = new Map<string, RawOperation[]>();
  for (const op of rawOps) {
    const h = op.transaction_hash;
    const list = map.get(h);
    if (list) list.push(op);
    else map.set(h, [op]);
  }
  return map;
}

function mapPaymentLikeTransfer(
  fromAddr: string | undefined,
  toAddr: string | undefined,
  amountStr: string | undefined,
  asset: AssetInfo,
): BlockOperation[] {
  const amount = toStroops(amountStr);
  if (amount === 0n) {
    return [];
  }
  const ops: BlockOperation[] = [];
  if (fromAddr) {
    ops.push({
      type: "transfer",
      address: fromAddr,
      ...(toAddr && { peer: toAddr }),
      asset,
      amount: -amount,
    });
  }
  if (toAddr) {
    ops.push({
      type: "transfer",
      address: toAddr,
      ...(fromAddr && { peer: fromAddr }),
      asset,
      amount,
    });
  }
  return ops;
}

function blockOperationsPathStrictSend(op: RawPathStrictSendOp): BlockOperation[] {
  const destAsset = assetFromHorizonFields(op.asset_type, op.asset_code, op.asset_issuer);
  const sourceAsset = assetFromHorizonFields(
    op.source_asset_type,
    op.source_asset_code,
    op.source_asset_issuer,
  );
  return pathStrictDualLegTransfers({
    fromAddr: op.from,
    toAddr: op.to,
    sourceAsset,
    destAsset,
    sourceStroops: toStroops(op.source_amount),
    destStroops: toStroops(op.amount),
  });
}

function blockOperationsPathStrictReceive(op: RawPathStrictReceiveOp): BlockOperation[] {
  const destAsset = assetFromHorizonFields(op.asset_type, op.asset_code, op.asset_issuer);
  const sourceAsset = assetFromHorizonFields(
    op.source_asset_type,
    op.source_asset_code,
    op.source_asset_issuer,
  );
  // Horizon reports actual source debit in `source_amount`; `send_max` is only the envelope cap.
  const sourceStroops = toStroops(op.source_amount ?? op.send_max);
  return pathStrictDualLegTransfers({
    fromAddr: op.from,
    toAddr: op.to,
    sourceAsset,
    destAsset,
    sourceStroops,
    destStroops: toStroops(op.amount),
  });
}

type TxContext = {
  memo: { type: string; value?: string } | undefined;
  sequence: string | undefined;
};

function decodeMemo(
  tx: Awaited<ReturnType<RawOperation["transaction"]>>,
): { type: string; value?: string } | undefined {
  switch (tx.memo_type) {
    case "none":
      return { type: "NO_MEMO" };
    case "id":
      return tx.memo ? { type: "MEMO_ID", value: tx.memo as string } : undefined;
    case "text":
      return tx.memo ? { type: "MEMO_TEXT", value: tx.memo as string } : undefined;
    case "hash":
      return tx.memo ? { type: "MEMO_HASH", value: tx.memo as string } : undefined;
    case "return":
      return tx.memo ? { type: "MEMO_RETURN", value: tx.memo as string } : undefined;
    default:
      return undefined;
  }
}

function mapSupportedOperationToBlockOperations(
  op: SupportedGetBlockOperation,
  txCtx: TxContext,
): BlockOperation[] {
  if (op.type === "payment") {
    const asset = assetFromHorizonFields(op.asset_type, op.asset_code, op.asset_issuer);
    const toAddr = op.to_muxed || op.to;
    return mapPaymentLikeTransfer(op.from, toAddr, op.amount, asset);
  }
  if (op.type === "create_account") {
    return mapPaymentLikeTransfer(op.funder, op.account, op.starting_balance, NATIVE_ASSET);
  }
  if (op.type === "change_trust") {
    const isOptOut = new BigNumber(op.limit || "0").eq(0);
    // Align with listOperations details (convertToLegacyOperation output)
    return [
      {
        type: "other",
        ledgerOpType: isOptOut ? "OPT_OUT" : "OPT_IN",
        assetAmount: op.asset_code ? op.limit : undefined,
        ...(txCtx.memo && { memo: txCtx.memo }),
        ...(txCtx.sequence && { sequence: txCtx.sequence }),
      },
    ];
  }
  if (op.type === "path_payment_strict_send") {
    return blockOperationsPathStrictSend(op);
  }
  if (op.type === "path_payment_strict_receive") {
    return blockOperationsPathStrictReceive(op);
  }
  return assertUnreachable(op);
}

async function blockTransactionForHash(
  hash: string,
  ops: RawOperation[],
): Promise<BlockTransaction | null> {
  if (ops.length === 0) return null;
  const failed = !ops[0].transaction_successful;

  const tx = await ops[0].transaction();
  const txCtx: TxContext = {
    memo: decodeMemo(tx),
    sequence: tx.source_account_sequence,
  };

  let blockOperations: BlockOperation[] = [];
  if (!failed) {
    for (const op of ops) {
      if (isSupportedGetBlockOperation(op)) {
        blockOperations = blockOperations.concat(mapSupportedOperationToBlockOperations(op, txCtx));
      }
    }
  }

  const fees = BigInt(tx.fee_charged || "0");
  const feesPayer = tx.fee_account || tx.source_account;

  return {
    hash,
    failed,
    fees,
    ...(feesPayer ? { feesPayer } : {}),
    operations: blockOperations,
  };
}

async function buildBlockTransactions(rawOps: RawOperation[]): Promise<BlockTransaction[]> {
  const order = orderTransactionHashes(rawOps);
  const byHash = groupOpsByHash(rawOps);
  const out: BlockTransaction[] = [];

  for (const hash of order) {
    // `order` and `byHash` are built from the same `rawOps`; every ordered hash has a non-empty op list.
    const ops = byHash.get(hash)!;
    const row = await blockTransactionForHash(hash, ops);
    if (row) {
      out.push(row);
    }
  }

  return out;
}

/**
 * Returns the Stellar closed ledger at `height` (ledger sequence) with mapped
 * `BlockTransaction` entries (see `SUPPORTED_GETBLOCK_OP_TYPES` for which Horizon
 * operations are included).
 *
 * Only supported payment / path / trust / create-account operations contribute
 * balance operations; other Horizon operation types are skipped for successful
 * transactions. Failed transactions still appear with `failed: true`, fees
 * populated, and empty `operations`.
 */
export async function getBlock(height: number): Promise<Block> {
  if (!Number.isSafeInteger(height) || height <= 0) {
    throw new Error(`getBlock: height must be a positive integer, got ${height}`);
  }

  const [ledger, rawOps] = await Promise.all([
    fetchLedgerRecord(height),
    fetchAllLedgerOperations(height),
  ]);

  let parent: BlockInfo["parent"];
  if (height > 1) {
    const prevHash = (ledger as { prev_hash?: string }).prev_hash;
    if (prevHash) {
      parent = { height: height - 1, hash: prevHash };
    } else {
      const parentLedger = await fetchLedgerRecord(height - 1);
      parent = { height: parentLedger.sequence, hash: parentLedger.hash };
    }
  }

  const info: BlockInfo = {
    height: ledger.sequence,
    hash: ledger.hash,
    time: new Date(ledger.closed_at),
    ...(parent && { parent }),
  };

  const transactions = await buildBlockTransactions(rawOps);
  return { info, transactions };
}
