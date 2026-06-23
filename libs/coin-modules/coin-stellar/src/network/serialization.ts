/*
 * Serialization functions from Horizon to Ledger Live types
 */
import type { Operation } from "@ledgerhq/coin-module-framework/api/types";
import { Horizon } from "@stellar/stellar-sdk";
import BigNumber from "bignumber.js";
import type { BalanceAsset, RawOperation, StellarMemo } from "../types";
import { parseAPIValue } from "../logic/common";

// Constants
const BASE_RESERVE_MIN_COUNT = 2;
export const BASE_RESERVE = 0.5;
export const MIN_BALANCE = 1;

/**
 * Stellar operation types that produce a typed (non-FEES) Operation when the
 * address is involved. Other types fall back to a single FEES row per tx (when
 * the address paid the fee) — see `formatFeeOnlyOperation`.
 */
const SUPPORTED_OPERATION_TYPES = new Set<string>([
  "create_account",
  "payment",
  "path_payment_strict_send",
  "path_payment_strict_receive",
  "change_trust",
  "liquidity_pool_deposit",
  "liquidity_pool_withdraw",
]);

export function getReservedBalance(account: Horizon.ServerApi.AccountRecord): BigNumber {
  const numOfSponsoringEntries = Number(account.num_sponsoring);
  const numOfSponsoredEntries = Number(account.num_sponsored);

  const nativeAsset = account.balances?.find(b => b.asset_type === "native") as BalanceAsset;

  const amountInOffers = new BigNumber(nativeAsset?.selling_liabilities || 0);
  const numOfEntries = new BigNumber(account.subentry_count || 0);

  return new BigNumber(BASE_RESERVE_MIN_COUNT)
    .plus(numOfEntries)
    .plus(numOfSponsoringEntries)
    .minus(numOfSponsoredEntries)
    .times(BASE_RESERVE)
    .plus(amountInOffers);
}

export async function rawOperationsToOperations(
  operations: RawOperation[],
  addr: string,
  accountId: string,
  minHeight: number,
): Promise<Operation[]> {
  // First pass: per raw op, format it when it passes the address+type filters.
  // A single raw op can produce zero, one, or several `Operation` rows (e.g.
  // a self-swap path payment surfaces both its native source debit and its
  // token destination credit; a liquidity_pool_deposit surfaces one row per
  // deposited reserve).
  const formatted = await Promise.all(
    operations.map(async operation => {
      if (!operationInvolvesAddress(operation, addr)) return [];
      if (!SUPPORTED_OPERATION_TYPES.has(operation.type)) return [];
      return formatOperation(operation, accountId, addr, minHeight);
    }),
  );

  // Stellar transactions whose fee is already carried by at least one surfaced
  // Operation. We never emit a redundant fee row for these.
  const txHashesAlreadySurfaced = new Set(formatted.flat().map(op => op.tx.hash));

  // Second pass: for every Stellar tx the address actually paid the fee on but
  // that produced no surfaced Operation (e.g. `create_claimable_balance`-only,
  // `set_options`-only, `bump_sequence`-only, ...), emit a single fee-only
  // Operation so its `fee_charged` is not silently dropped from the operations
  // list. We slot it at the position of the first raw op of that tx in the
  // input order to preserve the page's descending order.
  const feeOnlyEmitted = new Set<string>();
  const feeOnly = await Promise.all(
    operations.map(async operation => {
      if (txHashesAlreadySurfaced.has(operation.transaction_hash)) return undefined;
      if (feeOnlyEmitted.has(operation.transaction_hash)) return undefined;
      feeOnlyEmitted.add(operation.transaction_hash);
      return formatFeeOnlyOperation(operation, accountId, addr, minHeight);
    }),
  );

  const result: Operation[] = [];
  for (let i = 0; i < operations.length; i++) {
    const feeOp = feeOnly[i];
    if (feeOp) result.push(feeOp);
    result.push(...formatted[i]);
  }
  return result;
}

function operationInvolvesAddress(operation: RawOperation, addr: string): boolean {
  return (
    operation.from === addr ||
    operation.to === addr ||
    operation.funder === addr ||
    operation.account === addr ||
    operation.trustor === addr ||
    operation.source_account === addr
  );
}

type FormatCtx = {
  rawOperation: RawOperation;
  accountId: string;
  addr: string;
  transaction: Awaited<ReturnType<RawOperation["transaction"]>>;
  baseTxFields: Operation["tx"];
  baseDetails: {
    pagingToken: string;
    blockTime: Date;
    index: string;
    memo: StellarMemo | undefined;
    sequence: string | undefined;
  };
};

async function formatOperation(
  rawOperation: RawOperation,
  accountId: string,
  addr: string,
  minHeight: number,
): Promise<Operation[]> {
  const transaction = await rawOperation.transaction();

  if (transaction.ledger_attr < minHeight) return [];

  const { hash: blockHash, closed_at: blockTime } = await transaction.ledger();
  const memo = decodeMemo(transaction);

  const baseTxFields: Operation["tx"] = {
    hash: rawOperation.transaction_hash,
    block: {
      hash: blockHash,
      time: new Date(blockTime),
      height: transaction.ledger_attr,
    },
    fees: BigInt(transaction.fee_charged),
    date: new Date(rawOperation.created_at),
    failed: !rawOperation.transaction_successful,
    ...(transaction.fee_account ? { feesPayer: transaction.fee_account } : {}),
  };

  const baseDetails = {
    pagingToken: rawOperation.paging_token,
    blockTime: new Date(blockTime),
    index: rawOperation.id,
    memo,
    sequence: parseSequence(transaction.source_account_sequence),
  };

  const ctx: FormatCtx = {
    rawOperation,
    accountId,
    addr,
    transaction,
    baseTxFields,
    baseDetails,
  };

  switch (rawOperation.type) {
    case "path_payment_strict_send":
    case "path_payment_strict_receive":
      return formatPathPayment(ctx);
    case "liquidity_pool_deposit":
      return formatLiquidityPoolDeposit(ctx);
    case "liquidity_pool_withdraw":
      return formatLiquidityPoolWithdraw(ctx);
    default:
      return formatSimpleOperation(ctx);
  }
}

export function parseSequence(seq: string | number | undefined): string | undefined {
  const bn = new BigNumber(seq ?? "");
  return bn.isNaN() ? undefined : bn.toString();
}

/**
 * Format a single-leg operation — `payment`, `create_account`, `change_trust`.
 * Emits exactly one Operation. Token movements keep their pre-existing
 * convention of `type: "NONE"` (so they are filtered out of the native
 * account view) with `value = fee_charged` and the actual token amount stored
 * on `details.assetAmount` for the sub-account adapter to consume.
 */
function formatSimpleOperation(ctx: FormatCtx): Operation[] {
  const { rawOperation, accountId, transaction, baseTxFields, baseDetails, addr } = ctx;
  const type = getSimpleOperationType(rawOperation, addr);
  const value = getSimpleOperationValue(rawOperation, transaction, type);
  const recipients = getRecipients(rawOperation);

  const isToken = !!(rawOperation.asset_code && rawOperation.asset_issuer);
  const finalType = isToken && !["OPT_IN", "OPT_OUT"].includes(type) ? "NONE" : type;
  const finalValue = isToken ? BigInt(transaction.fee_charged) : BigInt(value.toString());

  return [
    {
      id: `${accountId}-${rawOperation.transaction_hash}-${type}`,
      value: finalValue,
      type: finalType,
      senders: [rawOperation.source_account],
      recipients,
      tx: baseTxFields,
      asset:
        isToken && rawOperation.asset_code && rawOperation.asset_issuer
          ? {
              type: "token",
              assetReference: rawOperation.asset_code,
              assetOwner: rawOperation.asset_issuer,
            }
          : { type: "native" },
      details: {
        ...baseDetails,
        assetCode: rawOperation.asset_code,
        assetIssuer: rawOperation.asset_issuer,
        assetAmount: rawOperation.asset_code ? value.toString() : undefined,
        ledgerOpType: type,
      },
    },
  ];
}

// ===== path_payment_strict_send / path_payment_strict_receive =====

/**
 * Format a `path_payment_strict_*` op. Horizon exposes both the source asset
 * (`source_asset_*` / `source_amount`) and the destination asset (`asset_*` /
 * `amount`) on the same operation record. Each side that touches the listed
 * address is surfaced as its own row so the native XLM debit/credit is never
 * dropped:
 * - if `from === addr`, emit the source-side row (OUT) using `source_amount`;
 * - if `to === addr`, emit the destination-side row (IN) using `amount`;
 * - if both are the address (self-swap), both rows are emitted.
 *
 * Native-asset rows use `type: OUT|IN` and carry the value in stroops.
 * Token-asset rows keep the legacy `type: "NONE"` / `value = fee_charged`
 * convention with the real token amount written to `details.assetAmount`.
 */
function formatPathPayment(ctx: FormatCtx): Operation[] {
  const { rawOperation, addr } = ctx;
  const ops: Operation[] = [];
  const isSource = rawOperation.from === addr;
  const isDest = rawOperation.to === addr;
  const isMultiLeg = isSource && isDest;
  const sourceAsset = readSourceAsset(rawOperation);
  const destAsset = readDestAsset(rawOperation);
  const pathOp = rawOperation as RawOperation & {
    source_amount?: string;
    amount?: string;
  };

  if (isSource) {
    const amountStr = pathOp.source_amount ?? pathOp.amount ?? "0";
    ops.push(buildPathPaymentLeg(ctx, "OUT", sourceAsset, parseAPIValue(amountStr), isMultiLeg));
  }

  if (isDest) {
    const amountStr = pathOp.amount ?? "0";
    ops.push(buildPathPaymentLeg(ctx, "IN", destAsset, parseAPIValue(amountStr), isMultiLeg));
  }

  return ops;
}

type AssetInfo = { type: "native" } | { type: "token"; code: string; issuer: string };

function readSourceAsset(rawOperation: RawOperation): AssetInfo {
  const o = rawOperation as RawOperation & {
    source_asset_type?: string;
    source_asset_code?: string;
    source_asset_issuer?: string;
  };
  if (o.source_asset_type === "native") return { type: "native" };
  if (o.source_asset_code && o.source_asset_issuer) {
    return { type: "token", code: o.source_asset_code, issuer: o.source_asset_issuer };
  }
  return { type: "native" };
}

function readDestAsset(rawOperation: RawOperation): AssetInfo {
  const o = rawOperation as RawOperation & { asset_type?: string };
  if (o.asset_type === "native") return { type: "native" };
  if (rawOperation.asset_code && rawOperation.asset_issuer) {
    return {
      type: "token",
      code: rawOperation.asset_code,
      issuer: rawOperation.asset_issuer,
    };
  }
  return { type: "native" };
}

// Match the existing failed-tx convention: IN rows go to 0, OUT rows carry the
// fee charged so downstream consumers see the same fee debit they would for a
// non-path-payment failure (see `getSimpleOperationValue`).
function computeLegValue(
  isFailed: boolean,
  direction: "IN" | "OUT",
  isNative: boolean,
  amount: BigNumber,
  feeCharged: string | number,
): bigint {
  if (isFailed) {
    return direction === "IN" ? 0n : BigInt(feeCharged);
  }
  return isNative ? BigInt(amount.toString()) : BigInt(feeCharged);
}

type LegAssetFields = {
  label: string;
  asset: Operation["asset"];
  assetCode: string | undefined;
  assetIssuer: string | undefined;
  assetAmount: string | undefined;
};

function describeLegAsset(asset: AssetInfo, amount: BigNumber): LegAssetFields {
  if (asset.type === "native") {
    return {
      label: "NATIVE",
      asset: { type: "native" },
      assetCode: undefined,
      assetIssuer: undefined,
      assetAmount: undefined,
    };
  }
  return {
    label: `TOKEN-${asset.code}`,
    asset: { type: "token", assetReference: asset.code, assetOwner: asset.issuer },
    assetCode: asset.code,
    assetIssuer: asset.issuer,
    assetAmount: amount.toString(),
  };
}

function buildPathPaymentLeg(
  { rawOperation, accountId, addr, transaction, baseTxFields, baseDetails }: FormatCtx,
  direction: "IN" | "OUT",
  asset: AssetInfo,
  amount: BigNumber,
  isMultiLeg: boolean,
): Operation {
  const isNative = asset.type === "native";
  const value = computeLegValue(
    !rawOperation.transaction_successful,
    direction,
    isNative,
    amount,
    transaction.fee_charged,
  );

  const ledgerOpType = isNative ? direction : "NONE";
  const {
    label,
    asset: opAsset,
    assetCode,
    assetIssuer,
    assetAmount,
  } = describeLegAsset(asset, amount);
  const legSuffix = isMultiLeg ? `-${direction}-${label}` : "";

  // Counterparties: for the OUT leg the recipient is whatever Horizon recorded
  // as `to`; for the IN leg the sender is whoever Horizon recorded as `from`
  // (or the operation's `source_account` when `from` is missing in test
  // fixtures).
  const senders =
    direction === "OUT"
      ? [rawOperation.source_account]
      : [rawOperation.from || rawOperation.source_account];
  const recipients = direction === "OUT" ? [rawOperation.to || addr] : [addr];

  return {
    id: `${accountId}-${rawOperation.transaction_hash}-${ledgerOpType}${legSuffix}`,
    value,
    type: ledgerOpType,
    senders,
    recipients,
    tx: baseTxFields,
    asset: opAsset,
    details: {
      ...baseDetails,
      index: isMultiLeg ? `${rawOperation.id}${legSuffix}` : rawOperation.id,
      assetCode,
      assetIssuer,
      assetAmount,
      ledgerOpType,
    },
  };
}

// ===== liquidity_pool_deposit / liquidity_pool_withdraw =====

/**
 * Format a `liquidity_pool_deposit` op into one row per asset that left the
 * account (Horizon stores the actual deposited amounts on `reserves_deposited`,
 * which mirror the `liquidity_pool_deposited` effect).
 */
function formatLiquidityPoolDeposit(ctx: FormatCtx): Operation[] {
  const reserves = readPoolReserves(ctx.rawOperation, "reserves_deposited");
  return reserves.map(reserve => buildPoolLeg(ctx, "OUT", reserve, reserves.length > 1));
}

/**
 * Format a `liquidity_pool_withdraw` op into one row per asset that came back
 * to the account (Horizon stores the actual withdrawn amounts on
 * `reserves_received`, which mirror the `liquidity_pool_withdrew` effect).
 */
function formatLiquidityPoolWithdraw(ctx: FormatCtx): Operation[] {
  const reserves = readPoolReserves(ctx.rawOperation, "reserves_received");
  return reserves.map(reserve => buildPoolLeg(ctx, "IN", reserve, reserves.length > 1));
}

type PoolReserve = { asset: AssetInfo; amount: BigNumber };

function readPoolReserves(
  rawOperation: RawOperation,
  field: "reserves_deposited" | "reserves_received",
): PoolReserve[] {
  const arr = (
    rawOperation as RawOperation & {
      reserves_deposited?: Array<{ asset: string; amount: string }>;
      reserves_received?: Array<{ asset: string; amount: string }>;
    }
  )[field];
  if (!arr || arr.length === 0) return [];
  return arr.map(r => ({
    asset: parseAssetString(r.asset),
    amount: parseAPIValue(r.amount),
  }));
}

function parseAssetString(asset: string): AssetInfo {
  if (asset === "native") return { type: "native" };
  const idx = asset.indexOf(":");
  if (idx === -1) return { type: "native" };
  return {
    type: "token",
    code: asset.slice(0, idx),
    issuer: asset.slice(idx + 1),
  };
}

function buildPoolLeg(
  { rawOperation, accountId, addr, transaction, baseTxFields, baseDetails }: FormatCtx,
  direction: "IN" | "OUT",
  reserve: PoolReserve,
  isMultiLeg: boolean,
): Operation {
  const { asset, amount } = reserve;
  const isFailed = !rawOperation.transaction_successful;
  const value = isFailed
    ? direction === "IN"
      ? 0n
      : BigInt(transaction.fee_charged)
    : asset.type === "native"
      ? BigInt(amount.toString())
      : BigInt(transaction.fee_charged);

  const ledgerOpType = asset.type === "native" ? direction : "NONE";
  // Pool ops always involve at least 2 reserves (one of which is usually
  // native), so we always disambiguate per-leg ids/indices to avoid clashes
  // when a single raw op produces multiple rows.
  const legSuffix = isMultiLeg
    ? `-${asset.type === "native" ? "NATIVE" : `TOKEN-${asset.code}`}`
    : "";

  return {
    id: `${accountId}-${rawOperation.transaction_hash}-${ledgerOpType}${legSuffix}`,
    value,
    type: ledgerOpType,
    senders: [addr],
    recipients: [],
    tx: baseTxFields,
    asset:
      asset.type === "native"
        ? { type: "native" }
        : { type: "token", assetReference: asset.code, assetOwner: asset.issuer },
    details: {
      ...baseDetails,
      index: isMultiLeg ? `${rawOperation.id}${legSuffix}` : rawOperation.id,
      assetCode: asset.type === "native" ? undefined : asset.code,
      assetIssuer: asset.type === "native" ? undefined : asset.issuer,
      assetAmount: asset.type === "native" ? undefined : amount.toString(),
      ledgerOpType,
    },
  };
}

/**
 * Emit a single fee-only Operation that carries `fee_charged` for a Stellar
 * transaction the address paid for but which produced no other surfaced
 * Operation. The Operation is marked `type: "FEES"` so the downstream
 * generic-coin-framework adapter renders it as a fee entry with
 * `value = 0 + fees` and `fee = fees`, matching the on-chain XLM debit.
 */
async function formatFeeOnlyOperation(
  rawOperation: RawOperation,
  accountId: string,
  addr: string,
  minHeight: number,
): Promise<Operation | undefined> {
  const transaction = await rawOperation.transaction();

  if (transaction.ledger_attr < minHeight) return undefined;

  // For non-fee-bump transactions Horizon sets `fee_account === source_account`;
  // for fee-bump transactions it is the outer fee payer. Only emit a fee row
  // when the address we are listing is the actual payer of the network fee.
  const feePayer = transaction.fee_account ?? transaction.source_account;
  if (feePayer !== addr) return undefined;

  const { hash: blockHash, closed_at: blockTime } = await transaction.ledger();
  const memo = decodeMemo(transaction);

  return {
    id: `${accountId}-${rawOperation.transaction_hash}-FEES`,
    value: 0n,
    type: "FEES",
    senders: [feePayer],
    recipients: [],
    tx: {
      hash: rawOperation.transaction_hash,
      block: {
        hash: blockHash,
        time: new Date(blockTime),
        height: transaction.ledger_attr,
      },
      fees: BigInt(transaction.fee_charged),
      date: new Date(rawOperation.created_at),
      failed: !rawOperation.transaction_successful,
      ...(transaction.fee_account ? { feesPayer: transaction.fee_account } : {}),
    },
    asset: { type: "native" },
    details: {
      pagingToken: rawOperation.paging_token,
      assetCode: undefined,
      assetIssuer: undefined,
      assetAmount: undefined,
      ledgerOpType: "FEES",
      blockTime: new Date(blockTime),
      index: rawOperation.id,
      memo,
      sequence: parseSequence(transaction.source_account_sequence),
    },
  };
}

export function decodeMemo(transaction: Horizon.ServerApi.TransactionRecord): StellarMemo | undefined {
  switch (transaction.memo_type) {
    case "none":
      return { type: "NO_MEMO" };
    case "id":
      return transaction.memo ? { type: "MEMO_ID", value: transaction.memo } : undefined;
    case "text":
      return transaction.memo ? { type: "MEMO_TEXT", value: transaction.memo } : undefined;
    case "return":
      return transaction.memo
        ? {
            type: "MEMO_RETURN",
            value: Buffer.from(transaction.memo, "base64").toString("hex"),
          }
        : undefined;
    case "hash":
      return transaction.memo
        ? {
            type: "MEMO_HASH",
            value: Buffer.from(transaction.memo, "base64").toString("hex"),
          }
        : undefined;
    default:
      return undefined;
  }
}

function getRecipients(operation: RawOperation): string[] {
  switch (operation.type) {
    case "create_account":
      return [operation.account];

    case "payment":
      return [operation.to_muxed || operation.to];

    default:
      return [];
  }
}

function getSimpleOperationValue(
  operation: RawOperation,
  transaction: Horizon.ServerApi.TransactionRecord,
  type: string,
): BigNumber {
  let value = new BigNumber(0);

  if (!operation.transaction_successful) {
    return type === "IN" ? value : new BigNumber(transaction.fee_charged || 0);
  }

  switch (operation.type) {
    case "create_account":
      return parseAPIValue(operation.starting_balance);
    case "payment":
      return parseAPIValue(operation.amount);

    default:
      return type !== "IN" ? new BigNumber(transaction.fee_charged) : value;
  }
}

function getSimpleOperationType(operation: RawOperation, addr: string): string {
  switch (operation.type) {
    case "create_account":
      return operation.funder === addr ? "OUT" : "IN";

    case "payment":
      if (operation.from === addr && operation.to !== addr) {
        return "OUT";
      }

      return "IN";

    case "change_trust":
      if (new BigNumber(operation.limit).eq(0)) {
        return "OPT_OUT";
      }

      return "OPT_IN";

    default:
      if (operation.source_account === addr) {
        return "OUT";
      }

      return "IN";
  }
}
