import type { ListOperationsOptions } from "@ledgerhq/coin-module-framework/api/index";
import { isPltRejectReason } from "../../network/plt";
import { getTransactions } from "../../network/proxyClient";
import type {
  ConcordiumCoinConfig,
  RawOperation,
  TransactionQueryParams,
  WalletProxyTransaction,
} from "../../types";
import { decodeMemo } from "./memo";

const DEFAULT_PAGE_SIZE = 100;

/**
 * Shares a spelling with the `type` sent to `/v0/transactionCost`, which is a
 * request parameter in another namespace: deliberately not one constant.
 */
const TOKEN_UPDATE_DETAILS_TYPE = "tokenUpdate";

export interface RawOperationPage {
  items: RawOperation[];
  next: string | undefined;
}

function transactionFields(
  tx: WalletProxyTransaction,
): Pick<RawOperation, "hash" | "date" | "blockHash" | "blockHeight" | "id"> {
  return {
    hash: tx.transactionHash,
    date: new Date(Math.floor(tx.blockTime) * 1000),
    blockHash: tx.blockHash || null,
    blockHeight: tx.blockHeight,
    id: tx.id,
  };
}

/** `cost` is reported only to the payer, so elsewhere it is absent, not zero. */
function isFeePayer(tx: WalletProxyTransaction): boolean {
  return tx.origin.type === "self";
}

function parseNativeTransfer(tx: WalletProxyTransaction, address: string): RawOperation | null {
  // A rejection carries none of the transfer fields, so neither party can be
  // read off it and only the payer's row exists at all. Without this the
  // transaction disappears and the CCD it cost with it.
  if (tx.details.outcome === "reject") {
    return isFeePayer(tx) ? feeOnlyOperation(tx, address, true) : null;
  }

  const sender = tx.details.transferSource || "";
  const recipient = tx.details.transferDestination || "";

  const isOutgoing = sender === address;
  const isIncoming = recipient === address;

  if (!isOutgoing && !isIncoming) {
    return null;
  }

  const amount = tx.details.transferAmount || "0";
  const fee = String(tx.cost || 0);

  return {
    ...transactionFields(tx),
    type: isOutgoing ? "OUT" : "IN",
    sender,
    recipient,
    amount,
    fee,
    value: isOutgoing ? String(BigInt(amount) + BigInt(fee)) : amount,
    memo: tx.details.memo ? decodeMemo(tx.details.memo, tx.transactionHash) : undefined,
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
 * The CCD an unreadable `tokenUpdate` cost. Naming a token keeps it a token
 * operation worth nothing; without one it degrades to a plain CCD cost.
 */
function feeOnlyOperation(
  tx: WalletProxyTransaction,
  address: string,
  failed: boolean,
  tokenId?: string,
): RawOperation {
  const fee = String(tx.cost || 0);

  return {
    ...transactionFields(tx),
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
function parseRejectedTokenUpdate(
  tx: WalletProxyTransaction,
  address: string,
): RawOperation | null {
  if (!isFeePayer(tx)) return null;

  return feeOnlyOperation(tx, address, true, rejectedTokenId(tx));
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
function parseTokenUpdate(tx: WalletProxyTransaction, address: string): RawOperation | null {
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
    return isFeePayer(tx) ? feeOnlyOperation(tx, address, false) : null;
  }

  const isOutgoing = transferSource === address;
  if (!isOutgoing && transferDestination !== address) {
    return null;
  }

  return {
    ...transactionFields(tx),
    type: isOutgoing ? "OUT" : "IN",
    sender: transferSource,
    recipient: transferDestination,
    amount: tokenTransferAmount.value,
    fee: isFeePayer(tx) ? String(tx.cost || 0) : "0",
    // The token amount alone: the fee is CCD and belongs to the parent
    // operation, so folding it in here would put µCCD into a token balance.
    value: tokenTransferAmount.value,
    memo: tx.details.memo ? decodeMemo(tx.details.memo, tx.transactionHash) : undefined,
    failed: false,
    tokenId,
    decimals: tokenTransferAmount.decimals,
  };
}

export function parseTransaction(tx: WalletProxyTransaction, address: string): RawOperation | null {
  if (tx.details.type === TOKEN_UPDATE_DETAILS_TYPE) {
    return parseTokenUpdate(tx, address);
  }

  if (tx.details.type !== "transfer" && tx.details.type !== "transferWithMemo") {
    return null;
  }

  return parseNativeTransfer(tx, address);
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
