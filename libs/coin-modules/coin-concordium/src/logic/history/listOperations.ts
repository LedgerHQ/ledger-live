import type { ListOperationsOptions } from "@ledgerhq/coin-module-framework/api/index";
import { isPltRejectReason } from "../../network/plt";
import { getTransactions } from "../../network/proxyClient";
import { isSameAccount } from "../account/sameAccount";
import type {
  ConcordiumCoinConfig,
  RawOperation,
  TransactionQueryParams,
  WalletProxyTransaction,
} from "../../types";
import { decodeMemo, decodePltMemo } from "./memo";
import { pltRejectCode } from "./pltRejectCode";

const DEFAULT_PAGE_SIZE = 100;

/**
 * Shares a spelling with the `type` sent to `/v0/transactionCost`, which is a
 * request parameter in another namespace: deliberately not one constant.
 */
const TOKEN_UPDATE_DETAILS_TYPE = "tokenUpdate";

const NATIVE_TRANSFER_TYPES: ReadonlySet<string> = new Set(["transfer", "transferWithMemo"]);

const SCHEDULED_TRANSFER_TYPES: ReadonlySet<string> = new Set([
  "transferWithSchedule",
  "transferWithScheduleAndMemo",
]);

type HashedTransaction = WalletProxyTransaction & { transactionHash: string };

const hasHash = (tx: WalletProxyTransaction): tx is HashedTransaction =>
  Boolean(tx.transactionHash);

export interface RawOperationPage {
  items: RawOperation[];
  next: string | undefined;
}

function transactionFields(
  tx: HashedTransaction,
  address: string,
): Pick<
  RawOperation,
  "hash" | "date" | "blockHash" | "blockHeight" | "id" | "transactionFee" | "feesPayer"
> {
  const feesPayer = feesPayerOf(tx, address);

  return {
    hash: tx.transactionHash,
    date: new Date(Math.floor(tx.blockTime) * 1000),
    blockHash: tx.blockHash || null,
    blockHeight: tx.blockHeight,
    id: tx.id,
    // `cost` is only the queried account's share, and 0 for a sponsored sender.
    // A proxy older than 0.51.0 omits `transactionCost` but sends `sponsor` on
    // every row; without either, only the payer's view knows the cost.
    transactionFee: String(tx.transactionCost ?? tx.sponsor?.cost ?? tx.cost ?? 0),
    ...(feesPayer ? { feesPayer } : {}),
  };
}

/** Whether the queried account sent the transaction; it paid the cost unless a sponsor did. */
function isSentByAccount(tx: WalletProxyTransaction): boolean {
  return tx.origin.type === "self";
}

/**
 * Who paid the cost, as `getBlock` reports it: the sponsor of a sponsored
 * transaction, else the sender. The proxy names the sender as `origin`,
 * replacing the address with `self` when it is the queried account.
 */
function feesPayerOf(tx: WalletProxyTransaction, address: string): string | undefined {
  if (tx.sponsor) {
    return isSameAccount(tx.sponsor.sponsor, address) ? address : tx.sponsor.sponsor;
  }
  return isSentByAccount(tx) ? address : tx.origin.address;
}

/** The microCCD this account paid for the transaction, as its sponsor or its unsponsored sender. */
function paidCost(tx: WalletProxyTransaction, address: string): bigint {
  if (tx.sponsor) {
    return isSameAccount(tx.sponsor.sponsor, address) ? BigInt(tx.sponsor.cost) : 0n;
  }
  return isSentByAccount(tx) ? BigInt(tx.cost || 0) : 0n;
}

function nativeMemo(tx: HashedTransaction): string | undefined {
  return tx.details.memo ? decodeMemo(tx.details.memo, tx.transactionHash) : undefined;
}

/** The fee the account paid for a transaction that moved none of its CCD, if it paid one. */
function feesOperation(
  tx: HashedTransaction,
  address: string,
  failed: boolean,
): RawOperation | null {
  const fee = paidCost(tx, address);
  if (fee === 0n) return null;

  return {
    ...transactionFields(tx, address),
    type: "FEES",
    sender: address,
    recipient: "",
    amount: "0",
    fee: String(fee),
    value: String(fee),
    memo: isSentByAccount(tx) ? nativeMemo(tx) : undefined,
    failed,
  };
}

function parseNativeTransfer(tx: HashedTransaction, address: string): RawOperation | null {
  // A rejection carries none of the transfer fields, so neither party can be
  // read off it and only the sender's and the sponsor's rows exist at all.
  if (tx.details.outcome === "reject") {
    return isSentByAccount(tx)
      ? sentWithoutTransfer(tx, address, true)
      : feesOperation(tx, address, true);
  }

  const sender = tx.details.transferSource || "";
  const recipient = tx.details.transferDestination || "";

  // The proxy lists every alias's transactions under the account but names each
  // party by the alias used on chain.
  const isOutgoing = isSameAccount(sender, address);
  const isIncoming = isSameAccount(recipient, address);

  if (!isOutgoing && !isIncoming) {
    return feesOperation(tx, address, false);
  }

  // Between two aliases of the account the amount never leaves it: only the fee does.
  const amount = isOutgoing && isIncoming ? "0" : tx.details.transferAmount || "0";
  const fee = paidCost(tx, address);

  return {
    ...transactionFields(tx, address),
    type: isOutgoing ? "OUT" : "IN",
    sender,
    recipient,
    amount,
    fee: String(fee),
    value: isOutgoing ? String(BigInt(amount) + fee) : amount,
    memo: nativeMemo(tx),
    failed: false,
  };
}

/**
 * Only the two chain-level PLT tags carry the token: `NonExistentTokenId` names
 * it directly, `TokenUpdateTransactionFailed` nests it in the module's reason.
 */
function rejectedTokenId(tx: WalletProxyTransaction): string | undefined {
  const reason = tx.details.rawRejectReason;
  if (!isPltRejectReason(reason)) return undefined;
  return reason.tag === "NonExistentTokenId" ? reason.contents : reason.contents.tokenId;
}

/**
 * A sent transfer or `tokenUpdate` with no transfer to read: rejected, or a token
 * update of another kind. Naming a token keeps it a token operation worth
 * nothing; without one it degrades to a plain CCD cost.
 */
function sentWithoutTransfer(
  tx: HashedTransaction,
  address: string,
  failed: boolean,
  tokenId?: string,
): RawOperation {
  const fee = String(paidCost(tx, address));

  return {
    ...transactionFields(tx, address),
    type: "OUT",
    sender: address,
    recipient: "",
    amount: "0",
    fee,
    value: tokenId === undefined ? fee : "0",
    memo: undefined,
    failed,
    ...(tokenId === undefined ? {} : { tokenId }),
  };
}

/** A rejection carries none of the transfer fields, and only the payer moved anything. */
function parseRejectedTokenUpdate(tx: HashedTransaction, address: string): RawOperation | null {
  if (!isSentByAccount(tx)) return feesOperation(tx, address, true);

  const operation = sentWithoutTransfer(tx, address, true, rejectedTokenId(tx));
  const rejectCode = pltRejectCode(tx.details.rawRejectReason);

  // Set conditionally so a reason this layer cannot narrow leaves the field
  // absent, rather than claiming a cause by defaulting to one.
  return rejectCode === undefined ? operation : { ...operation, rejectCode };
}

/** Bounded because it only ever selects a power of ten to divide the amount by. */
function isTokenDecimals(decimals: unknown): decimals is number {
  return (
    typeof decimals === "number" && Number.isInteger(decimals) && decimals >= 0 && decimals <= 255
  );
}

/**
 * The proxy renders the transfer fields only for a summary holding exactly one
 * account-to-account `TokenTransfer`; a mint, burn, list update, pause or batch
 * carries only the type and outcome, so none of them are defaulted here.
 */
function parseTokenUpdate(tx: HashedTransaction, address: string): RawOperation | null {
  if (tx.details.outcome === "reject") {
    return parseRejectedTokenUpdate(tx, address);
  }

  const { transferSource, transferDestination, tokenId, tokenTransferAmount } = tx.details;

  if (
    !transferSource ||
    !transferDestination ||
    !tokenId ||
    typeof tokenTransferAmount?.value !== "string" ||
    !isTokenDecimals(tokenTransferAmount.decimals)
  ) {
    // Not a transfer this layer can read, but the CCD it cost still left the
    // payer's account, and dropping it would show up as an unexplained debit.
    return isSentByAccount(tx)
      ? sentWithoutTransfer(tx, address, false)
      : feesOperation(tx, address, false);
  }

  const isOutgoing = isSameAccount(transferSource, address);
  const isIncoming = isSameAccount(transferDestination, address);
  if (!isOutgoing && !isIncoming) {
    return feesOperation(tx, address, false);
  }

  const amount = isOutgoing && isIncoming ? "0" : tokenTransferAmount.value;

  return {
    ...transactionFields(tx, address),
    type: isOutgoing ? "OUT" : "IN",
    sender: transferSource,
    recipient: transferDestination,
    amount,
    fee: String(paidCost(tx, address)),
    // The token amount alone: the fee is CCD and belongs to the parent
    // operation, so folding it in here would put µCCD into a token balance.
    value: amount,
    memo: tx.details.memo ? decodePltMemo(tx.details.memo, tx.transactionHash) : undefined,
    failed: false,
    tokenId,
    decimals: tokenTransferAmount.decimals,
  };
}

/** Throws rather than defaulting: a wrong amount would be stored for good. */
function microCcd(value: unknown, tx: HashedTransaction): bigint {
  if (typeof value === "string" && /^-?\d+$/.test(value)) return BigInt(value);
  if (typeof value === "number" && Number.isSafeInteger(value)) return BigInt(value);

  throw new Error(`concordium: transaction ${tx.transactionHash} carries no readable amount`);
}

function scheduledMovement(tx: HashedTransaction, address: string): bigint {
  const { transferDestination = "", transferAmount } = tx.details;

  if (isSentByAccount(tx)) return -microCcd(transferAmount, tx);
  return isSameAccount(transferDestination, address) ? microCcd(transferAmount, tx) : 0n;
}

/** The microCCD the transaction moved in or out of the account, without the fee. */
function movedAmount(tx: HashedTransaction, address: string): bigint {
  if (SCHEDULED_TRANSFER_TYPES.has(tx.details.type)) return scheduledMovement(tx, address);

  // Only a contract call pays an account that did not send it. The amounts of any
  // other type are the sender's, even when the proxy reports them to a sponsor.
  if (!isSentByAccount(tx) && tx.details.type !== "update") return 0n;

  return tx.cost === undefined ? microCcd(tx.total, tx) : microCcd(tx.subtotal ?? 0, tx);
}

function parseOtherTransaction(tx: HashedTransaction, address: string): RawOperation | null {
  if (tx.details.outcome === "reject") return feesOperation(tx, address, true);

  const moved = movedAmount(tx, address);
  if (moved === 0n) return feesOperation(tx, address, false);

  const fee = paidCost(tx, address);
  const common = {
    ...transactionFields(tx, address),
    fee: String(fee),
    memo: nativeMemo(tx),
    failed: false,
  };

  if (moved < 0n) {
    return {
      ...common,
      type: "OUT",
      sender: address,
      recipient: tx.details.transferDestination ?? "",
      amount: String(-moved),
      value: String(-moved + fee),
    };
  }

  // A contract pays in an `update`, whose origin is only the account that called it.
  const isScheduled = SCHEDULED_TRANSFER_TYPES.has(tx.details.type);
  return {
    ...common,
    type: "IN",
    sender: (isScheduled && tx.origin.address) || "",
    recipient: address,
    amount: String(moved),
    value: String(moved),
  };
}

export function parseTransaction(tx: WalletProxyTransaction, address: string): RawOperation | null {
  if (!hasHash(tx)) return null;
  if (tx.details.type === TOKEN_UPDATE_DETAILS_TYPE) return parseTokenUpdate(tx, address);
  if (NATIVE_TRANSFER_TYPES.has(tx.details.type)) return parseNativeTransfer(tx, address);

  return parseOtherTransaction(tx, address);
}

/**
 * Fetches one page of this account's operations.
 *
 * A fetch failure propagates: the caller walks pages newest first, so reporting
 * a failed page as the end of history would truncate what gets stored and move
 * the sync watermark past the gap for good.
 */
export async function listOperations(
  config: ConcordiumCoinConfig,
  address: string,
  options: ListOperationsOptions,
  currencyId: string,
): Promise<RawOperationPage> {
  const limit = options.limit || DEFAULT_PAGE_SIZE;

  const params: TransactionQueryParams = {
    limit,
    order: options.order === "asc" ? "a" : "d",
    // The proxy tests this parameter for presence, not value, so it must be
    // omitted rather than set to false to disable it.
    includeRawRejectReason: true,
    // `parseTransaction` drops every reward entry, and on a delegator or
    // validator account they outnumber the transfers by orders of magnitude.
    // Excluding them server-side is what keeps a full walk to a few requests.
    includeRewards: "none",
  };

  if (options.minHeight > 0) {
    params.blockHeightFrom = options.minHeight;
  }

  if (options.cursor) {
    params.from = options.cursor;
  }

  const response = await getTransactions(config, currencyId, address, params);

  if (!("transactions" in response) || !Array.isArray(response.transactions)) {
    // Reporting this as an empty page would read as the end of the history, and
    // the caller stores that as the whole of it.
    throw new Error("concordium: transaction response carried no transactions array");
  }

  const items = response.transactions
    .map(tx => parseTransaction(tx, address))
    .filter((op): op is RawOperation => op !== null);

  // A short page proves the end. Counted from the rows themselves rather than
  // `count`, which a malformed response can omit, ending the walk silently.
  const hasMore = response.transactions.length >= (response.limit ?? limit);
  let next: string | undefined;
  if (hasMore && response.transactions.length > 0) {
    const lastTx = response.transactions[response.transactions.length - 1];
    // The cursor is exclusive and ids are not contiguous per account, so it has
    // to be the last id seen rather than one past it.
    next = String(lastTx.id);
  }

  return { items, next };
}
