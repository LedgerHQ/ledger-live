import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { Address } from "@multiversx/sdk-core/out";
import { ESDT_CONTRACT_ADDRESS_HEX } from "@multiversx/sdk-core/out/constants";
import BigNumber from "bignumber.js";
import type { MultiversXNetworkApi } from "../../network/api";
import type {
  MultiversXApiTransaction,
  MultiversXTransactionAction,
  MultiversXTransactionOperation,
} from "../../types";
import { MultiversXTransferOptions } from "../../types";
import { MULTIVERSX_STAKING_POOL } from "../../constants";
import { BinaryUtils } from "../../utils/binary.utils";

const ESDT_SYSTEM_SC_BECH32 = Address.fromHex(ESDT_CONTRACT_ADDRESS_HEX).toBech32();

// Cap the number of concurrent per-token history fetches: an account holding
// many ESDT tokens would otherwise fan out into a large burst of parallel
// (internally-paginated) HTTP calls and risk rate-limiting/timeouts.
const MAX_TOKEN_HISTORY_CONCURRENCY = 5;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const worker = async (): Promise<void> => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index]);
    }
  };
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

function isSender(tx: MultiversXApiTransaction, addr: string): boolean {
  return tx.sender === addr;
}

function isSelfSend(tx: MultiversXApiTransaction): boolean {
  return !!tx.sender && !!tx.receiver && tx.sender === tx.receiver;
}

function decodeMode(action?: MultiversXTransactionAction): string {
  if (!action?.category || action.category !== "stake") return "send";
  return action.name;
}

function getEGLDOperationType(tx: MultiversXApiTransaction, addr: string): string {
  if (tx.action?.category === "stake") {
    switch (tx.action.name) {
      case "delegate":
        return "DELEGATE";
      case "unDelegate":
        return "UNDELEGATE";
      case "withdraw":
        return "WITHDRAW_UNBONDED";
      case "claimRewards":
        return "REWARD";
      case "reDelegateRewards":
        return "DELEGATE";
    }
  }
  if (!isSender(tx, addr)) return "IN";
  return tx.transfer === MultiversXTransferOptions.esdt ? "FEES" : "OUT";
}

function getStakingAmount(tx: MultiversXApiTransaction, address: string): BigNumber {
  const operation: MultiversXTransactionOperation | undefined = (tx.operations ?? []).find(
    ({ sender, receiver, action, type }) =>
      action === "transfer" &&
      type === "egld" &&
      sender === tx.receiver &&
      (receiver === address || receiver === MULTIVERSX_STAKING_POOL),
  );

  const mode = decodeMode(tx.action);
  switch (mode) {
    case "send":
      return new BigNumber(0);
    case "delegate":
      return new BigNumber(tx.value ?? 0);
    case "unDelegate": {
      const dataDecoded = BinaryUtils.base64Decode(tx.data ?? "");
      return new BigNumber(`0x${dataDecoded.split("@")[1] ?? "0"}`);
    }
    case "reDelegateRewards":
    case "claimRewards":
    case "withdraw":
    default:
      return new BigNumber(operation?.value ?? 0);
  }
}

// Operation `value` must EXCLUDE the fee for the types the generic-coin-framework
// adapter re-adds it to (OUT / FEES / DELEGATE / UNDELEGATE — see
// libs/ledger-live-common/src/bridge/generic-coin-framework/utils.ts); otherwise the
// fee is counted twice. IN and WITHDRAW_UNBONDED are passed through as-is.
function getEGLDOperationValue(tx: MultiversXApiTransaction, address: string): BigNumber {
  // ESDT transfer first: the sender's native leg is a FEES op (fee re-added by the
  // adapter) and the receiver moves no native — either way no native amount is
  // carried here. Checked before the mode branch because some API responses tag a
  // token transfer as action.category="stake"/name="transfer", which decodeMode
  // would otherwise route into the staking branch and return the fee (double-counted).
  if (tx.transfer === MultiversXTransferOptions.esdt) {
    return new BigNumber(0);
  }

  const mode = decodeMode(tx.action);
  if (mode !== "send") {
    // delegate / unDelegate / reDelegateRewards map to DELEGATE/UNDELEGATE ops whose
    // fee the adapter re-adds, so value excludes it (the staked principal is surfaced
    // via details.amount). withdraw is not fee-re-added and keeps the fee-only value.
    if (mode === "delegate" || mode === "unDelegate" || mode === "reDelegateRewards") {
      return new BigNumber(0);
    }
    return new BigNumber(tx.fee ?? 0);
  }

  // Native transfer: IN keeps the received amount; OUT (incl. self-send) excludes the
  // fee — a self-send moves no net amount, a normal OUT carries just tx.value.
  if (!isSender(tx, address)) return new BigNumber(tx.value ?? 0);
  if (isSelfSend(tx)) return new BigNumber(0);
  return new BigNumber(tx.value ?? 0);
}

function getESDTOperationValue(tx: MultiversXApiTransaction, tokenIdentifier?: string): BigNumber {
  const hasFailed = !tx.status || tx.status === "fail" || tx.status === "invalid";
  if (!tx.action || hasFailed) return new BigNumber(0);

  switch (tx.action.name) {
    case "transfer":
      return new BigNumber(tx.action.arguments?.transfers[0]?.value ?? 0);
    case "swap": {
      const t1 = tx.action.arguments?.transfers[0];
      const t2 = tx.action.arguments?.transfers[1];
      if (t1?.token === tokenIdentifier) return new BigNumber(t1.value);
      return new BigNumber(t2?.value ?? 0);
    }
    default:
      return new BigNumber(tx.tokenValue ?? 0);
  }
}

function egldOpToFramework(
  tx: MultiversXApiTransaction,
  address: string,
  operationIndex: number,
): Operation {
  const type = getEGLDOperationType(tx, address);
  const fee = new BigNumber(tx.fee ?? 0);
  const hasFailed = !tx.status || tx.status === "fail" || tx.status === "invalid";
  const delegationAmount = getStakingAmount(tx, address);

  let value: BigNumber;
  if (hasFailed) {
    value = isSender(tx, address) ? fee : new BigNumber(0);
  } else if (decodeMode(tx.action) === "claimRewards") {
    value = delegationAmount.minus(fee);
  } else {
    value = getEGLDOperationValue(tx, address);
  }

  return {
    id: `${address}-${tx.txHash ?? ""}-${type}-${operationIndex}`,
    type,
    senders: (type === "OUT" || type === "IN") && tx.sender ? [tx.sender] : [],
    recipients: (type === "OUT" || type === "IN") && tx.receiver ? [tx.receiver] : [],
    value: BigInt(value.toFixed(0)),
    asset: { type: "native" },
    tx: {
      hash: tx.txHash ?? "",
      block: {
        height: tx.round ?? 0,
        hash: tx.miniBlockHash ?? "",
        time: new Date((tx.timestamp ?? 0) * 1000),
      },
      fees: BigInt(fee.toFixed(0)),
      date: new Date((tx.timestamp ?? 0) * 1000),
      failed: hasFailed,
    },
    ...(delegationAmount.isZero() ? {} : { details: { amount: delegationAmount.toString() } }),
  };
}

function esdtOpToFramework(
  tx: MultiversXApiTransaction,
  address: string,
  tokenIdentifier: string,
  operationIndex: number,
): Operation {
  const type = isSender(tx, address) ? "OUT" : "IN";
  const value = getESDTOperationValue(tx, tokenIdentifier);
  const hasFailed = !tx.status || tx.status === "fail" || tx.status === "invalid";

  return {
    id: `${address}-${tx.txHash ?? ""}-${type}-${operationIndex}`,
    type,
    senders: tx.sender ? [tx.sender] : [],
    recipients: tx.receiver ? [tx.receiver] : [],
    value: BigInt(value.toFixed(0)),
    asset: {
      type: "esdt",
      assetReference: tokenIdentifier,
      assetOwner: ESDT_SYSTEM_SC_BECH32,
    },
    tx: {
      hash: tx.txHash ?? "",
      block: {
        height: tx.round ?? 0,
        hash: tx.miniBlockHash ?? "",
        time: new Date((tx.timestamp ?? 0) * 1000),
      },
      fees: 0n, // ESDT fees are paid on the parent native op
      date: new Date((tx.timestamp ?? 0) * 1000),
      failed: hasFailed,
    },
    details: {
      ledgerOpType: type,
      assetAmount: value.toFixed(),
      assetSenders: tx.sender ? [tx.sender] : [],
      assetRecipients: tx.receiver ? [tx.receiver] : [],
    },
  };
}

/**
 * List operations for a MultiversX address.
 * Merges native EGLD operations and ESDT token operations.
 * Cursor is a unix timestamp (seconds) used as the `after` parameter.
 */
export async function listOperations(
  api: MultiversXNetworkApi,
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation>> {
  // Guard against a non-numeric cursor — a NaN startAt would propagate to
  // `after=NaN` in the network calls and break sync.
  const parsedCursor = options.cursor ? Number.parseInt(options.cursor, 10) : 0;
  const startAt = Number.isNaN(parsedCursor) ? 0 : parsedCursor;

  // Let network failures propagate — swallowing them would let sync "succeed"
  // with an incomplete/empty history (silent data loss) instead of retrying.
  const [egldTxs, esdtTokens] = await Promise.all([
    api.getHistory(address, startAt),
    api.getESDTTokensForAddress(address),
  ]);

  const items: Operation[] = [];

  // Operation index is scoped per transaction hash (native op = 0, further ops
  // sharing the hash increment) so operation ids stay stable across syncs
  // regardless of how many other transactions the account has.
  const perTxIndex = new Map<string, number>();
  const nextIndexFor = (hash: string): number => {
    const i = perTxIndex.get(hash) ?? 0;
    perTxIndex.set(hash, i + 1);
    return i;
  };

  for (const tx of egldTxs) {
    items.push(egldOpToFramework(tx, address, nextIndexFor(tx.txHash ?? "")));
  }

  // Fetch ESDT operations for each token, with bounded concurrency to avoid a
  // parallel-request burst for accounts holding many tokens.
  const esdtOpArrays = await mapWithConcurrency(esdtTokens, MAX_TOKEN_HISTORY_CONCURRENCY, token =>
    api.getESDTTransactionsForAddress(address, token.identifier, startAt),
  );

  for (let i = 0; i < esdtTokens.length; i++) {
    const tokenIdentifier = esdtTokens[i].identifier;
    for (const tx of esdtOpArrays[i]) {
      items.push(esdtOpToFramework(tx, address, tokenIdentifier, nextIndexFor(tx.txHash ?? "")));
    }
  }

  // Honor minHeight (used by the framework for incremental sync): drop operations
  // below the requested block height. minHeight = 0 keeps everything.
  const filtered =
    options.minHeight > 0 ? items.filter(op => op.tx.block.height >= options.minHeight) : items;

  // Native and ESDT ops are appended in separate passes, so sort the merged page
  // by date (honoring options.order, default desc) — consumers expect a single
  // chronologically-ordered stream.
  const order = options.order ?? "desc";
  filtered.sort((a, b) =>
    order === "asc"
      ? a.tx.date.getTime() - b.tx.date.getTime()
      : b.tx.date.getTime() - a.tx.date.getTime(),
  );

  // The network layer (getHistory / getESDTTransactionsForAddress) already
  // exhausts pagination internally, so a single call returns the full operation
  // set for the requested cursor. There is no further page to advertise —
  // returning a cursor here would make consumers re-query and risk looping.
  return { items: filtered, next: undefined };
}
