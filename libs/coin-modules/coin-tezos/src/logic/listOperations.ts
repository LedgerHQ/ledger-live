import { Operation } from "@ledgerhq/coin-module-framework/api/types";
import { log } from "@ledgerhq/logs";
import { STAKING_ACTION_TO_OP_TYPE } from "../constants";
import { tzkt } from "../network";
import {
  type APIDelegationType,
  type APIOperation,
  type APIRevealType,
  type APIStakingType,
  type APITokenTransfer,
  type APITransactionType,
  AccountsGetOperationsOptions,
  isAPIDelegationType,
  isAPIRevealType,
  isAPIStakingType,
  isAPITransactionType,
  type TokenTransfersGetOptions,
} from "../network/types";

/** Block-level boundary + optional per-stream id cursors for intra-level continuation. */
type ListOperationsCursor = {
  lastLevel: number;
  nativeLastId?: number;
  tokenLastId?: number;
};

function parseCursor(token?: string): ListOperationsCursor | undefined {
  if (!token) return undefined;
  try {
    const parsed: unknown = JSON.parse(token);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const o = parsed as {
        lastLevel?: unknown;
        nativeLastId?: unknown;
        tokenLastId?: unknown;
      };
      if (typeof o.lastLevel === "number" && Number.isFinite(o.lastLevel)) {
        const cursor: ListOperationsCursor = { lastLevel: o.lastLevel };
        if (typeof o.nativeLastId === "number" && Number.isFinite(o.nativeLastId)) {
          cursor.nativeLastId = o.nativeLastId;
        }
        if (typeof o.tokenLastId === "number" && Number.isFinite(o.tokenLastId)) {
          cursor.tokenLastId = o.tokenLastId;
        }
        return cursor;
      }
    }
  } catch {
    // ignore invalid cursor
  }
  return undefined;
}

function minLevel<T extends { level: number }>(items: T[]): number | undefined {
  if (items.length === 0) return undefined;
  return Math.min(...items.map(i => i.level));
}

function maxLevel<T extends { level: number }>(items: T[]): number | undefined {
  if (items.length === 0) return undefined;
  return Math.max(...items.map(i => i.level));
}

/** When the API returned a full page, the trailing block level may be incomplete — drop it. */
function trimPartialLastLevel<T extends { level: number; id: number }>(
  items: T[],
  full: boolean,
): { trimmed: T[]; intraLevelLastId?: number } {
  if (!full || items.length === 0) return { trimmed: items };
  const last = items.at(-1);
  if (!last) return { trimmed: items };
  const lastLevel = last.level;
  const filtered = items.filter(op => op.level !== lastLevel);
  if (filtered.length === 0) {
    log("coin:tezos", "listOperations: full page single level — keeping all rows", {
      lastLevel,
      count: items.length,
    });
    return { trimmed: items, intraLevelLastId: last.id };
  }
  return { trimmed: filtered };
}

function buildNativeOptions(
  sort: "Ascending" | "Descending",
  cursor: ListOperationsCursor | undefined,
  minHeight: number,
): AccountsGetOperationsOptions {
  if (!cursor) {
    return { sort, "level.ge": minHeight };
  }

  const { lastLevel, nativeLastId } = cursor;

  if (sort === "Descending") {
    if (nativeLastId !== undefined) {
      return {
        sort,
        "level.ge": minHeight,
        "level.lt": lastLevel + 1,
        lastId: nativeLastId,
      };
    }
    return {
      sort,
      "level.ge": minHeight,
      "level.lt": lastLevel,
    };
  }

  if (nativeLastId !== undefined) {
    return {
      sort,
      "level.ge": Math.max(minHeight, lastLevel),
      lastId: nativeLastId,
    };
  }
  return {
    sort,
    "level.ge": Math.max(minHeight, lastLevel + 1),
  };
}

function buildTokenOptions(
  sort: "Ascending" | "Descending",
  cursor: ListOperationsCursor | undefined,
  minHeight: number,
): TokenTransfersGetOptions {
  if (!cursor) {
    return { sort, "level.ge": minHeight };
  }

  const { lastLevel, tokenLastId } = cursor;

  if (sort === "Descending") {
    if (tokenLastId !== undefined) {
      return {
        sort,
        "level.ge": minHeight,
        "level.lt": lastLevel + 1,
        "id.lt": tokenLastId,
      };
    }
    return {
      sort,
      "level.ge": minHeight,
      "level.lt": lastLevel,
    };
  }

  if (tokenLastId !== undefined) {
    return {
      sort,
      "level.ge": Math.max(minHeight, lastLevel),
      "id.gt": tokenLastId,
    };
  }
  return {
    sort,
    "level.ge": Math.max(minHeight, lastLevel + 1),
  };
}

function computeBoundary(
  nativeTrim: { level: number }[],
  tokenTrim: { level: number }[],
  sort: "Ascending" | "Descending",
): number | undefined {
  if (sort === "Descending") {
    const mn = minLevel(nativeTrim);
    const mt = minLevel(tokenTrim);
    if (mn === undefined && mt === undefined) return undefined;
    if (mn === undefined) return mt!;
    if (mt === undefined) return mn;
    return Math.max(mn, mt);
  }
  const xn = maxLevel(nativeTrim);
  const xt = maxLevel(tokenTrim);
  if (xn === undefined && xt === undefined) return undefined;
  if (xn === undefined) return xt!;
  if (xt === undefined) return xn;
  return Math.min(xn, xt);
}

function alignToBoundary<T extends { level: number }>(
  items: T[],
  boundary: number,
  sort: "Ascending" | "Descending",
): T[] {
  if (sort === "Descending") {
    return items.filter(op => op.level >= boundary);
  }
  return items.filter(op => op.level <= boundary);
}

function clampPage<T>(raw: T[], limit?: number): { sliced: T[]; full: boolean } {
  if (limit === undefined) {
    return { sliced: raw, full: false };
  }
  return {
    sliced: raw.slice(0, limit),
    full: raw.length >= limit,
  };
}

function buildParentMap(ops: APIOperation[]): Map<number, APITransactionType> {
  const parentMap = new Map<number, APITransactionType>();
  for (const op of ops) {
    if (isAPITransactionType(op) && op.id !== null) {
      parentMap.set(op.id, op);
    }
  }
  return parentMap;
}

function keepNativeOp(
  op: APIOperation,
  address: string,
): op is APITransactionType | APIDelegationType | APIRevealType | APIStakingType {
  if (
    !(
      isAPITransactionType(op) ||
      isAPIDelegationType(op) ||
      isAPIRevealType(op) ||
      isAPIStakingType(op)
    )
  ) {
    return false;
  }
  if (op.status !== "applied" && isAPITransactionType(op)) {
    const isIn = op.target?.address === address;
    if (isIn) {
      return false;
    }
  }
  return true;
}

function convertNativeOps(
  ops: APIOperation[],
  address: string,
  stakingBlockHashes: Map<number, string>,
): Operation[] {
  return ops
    .filter((op): op is APITransactionType | APIDelegationType | APIRevealType | APIStakingType =>
      keepNativeOp(op, address),
    )
    .map(op => convertOperation(address, op, stakingBlockHashes));
}

function convertTokenOps(
  transfers: (APITokenTransfer & { hash: string; block?: string })[],
  parentMap: Map<number, APITransactionType>,
  address: string,
): Operation[] {
  return transfers.map(transfer =>
    convertTokenOperation(
      address,
      transfer,
      transfer.transactionId ? parentMap.get(transfer.transactionId) : undefined,
    ),
  );
}

function computeNextToken(
  boundary: number | undefined,
  nativeFull: boolean,
  tokenFull: boolean,
  hasResults: boolean,
  nativeIntraLastId?: number,
  tokenIntraLastId?: number,
): string {
  const shouldEmitNext = boundary !== undefined && (nativeFull || tokenFull) && hasResults;
  if (!shouldEmitNext) return "";
  const payload: ListOperationsCursor = { lastLevel: boundary };
  if (nativeIntraLastId !== undefined) payload.nativeLastId = nativeIntraLastId;
  if (tokenIntraLastId !== undefined) payload.tokenLastId = tokenIntraLastId;
  return JSON.stringify(payload);
}

/**
 * Returns list of "Transfer", "Delegate" and "Undelegate" Operations associated to an account.
 * @param address Account address
 * @param limit the maximum number of operations to return. Beware that's a weak limit, as explorers might not respect it.
 * @param order whether to return operations starting from the top block or from the oldest block.
 *   "Descending" returns newest operation first, "Ascending" returns oldest operation first.
 *   It doesn't control the order of the operations in the result list:
 *     operations are always returned sorted in descending order (newest first).
 * @param minHeight retrieve operations from a specific block height until top most (inclusive).
 * @param token a token to be used for pagination
 * @returns a list of operations is descending (newest first) order and a token to be used for pagination
 */
export async function listOperations(
  address: string,
  {
    token,
    limit,
    sort,
    minHeight,
  }: { limit?: number; token?: string; sort: "Ascending" | "Descending"; minHeight: number },
): Promise<[Operation[], string]> {
  const cursor = parseCursor(token);

  const nativeOptions: AccountsGetOperationsOptions = {
    limit,
    ...buildNativeOptions(sort, cursor, minHeight),
  };

  const tokenOptions: TokenTransfersGetOptions = {
    limit,
    ...buildTokenOptions(sort, cursor, minHeight),
  };

  const [nativeOpsRaw, tokenTransfersRaw] = await Promise.all([
    tzkt.getAccountOperations(address, nativeOptions),
    tzkt.getAccountTokenTransfers(address, tokenOptions),
  ]);

  const nativePage = clampPage(nativeOpsRaw, limit);
  const tokenPage = clampPage(tokenTransfersRaw, limit);

  const nativeTrimmed = trimPartialLastLevel(nativePage.sliced, nativePage.full);
  const tokenTrimmed = trimPartialLastLevel(tokenPage.sliced, tokenPage.full);

  // when both streams are exhausted (neither hit the page limit),
  // we already have every op — alignment would silently discard ops
  // beyond the boundary with no cursor to retrieve them later. Skip it.
  const bothExhausted = !nativePage.full && !tokenPage.full;
  const boundary = bothExhausted
    ? undefined
    : computeBoundary(nativeTrimmed.trimmed, tokenTrimmed.trimmed, sort);

  const nativeAligned =
    boundary === undefined
      ? nativeTrimmed.trimmed
      : alignToBoundary(nativeTrimmed.trimmed, boundary, sort);
  const tokenAligned =
    boundary === undefined
      ? tokenTrimmed.trimmed
      : alignToBoundary(tokenTrimmed.trimmed, boundary, sort);

  const stakingBlockHashes = await fetchMissingStakingBlockHashes(nativeAligned);

  const parentMap = buildParentMap(nativeAligned);

  const nextToken = computeNextToken(
    boundary,
    nativePage.full,
    tokenPage.full,
    nativeAligned.length > 0 || tokenAligned.length > 0,
    nativeTrimmed.intraLevelLastId,
    tokenTrimmed.intraLevelLastId,
  );

  const filteredNativeOps = convertNativeOps(nativeAligned, address, stakingBlockHashes);
  const tokenConverted = convertTokenOps(tokenAligned, parentMap, address);

  const sortedOperations = [...filteredNativeOps, ...tokenConverted].sort(
    (a, b) => b.tx.date.getTime() - a.tx.date.getTime(),
  );
  return [sortedOperations, nextToken];
}

type ConvertibleOperation = APITransactionType | APIDelegationType | APIRevealType | APIStakingType;

/**
 * TzKT omits `block` on staking ops returned by /accounts/{addr}/operations.
 * Returns a level → block-hash map covering exactly those ops, so the caller
 * can populate `tx.block.hash` without mutating the API response. Network
 * failures are swallowed: callers fall back to `""` for levels not in the map.
 */
async function fetchMissingStakingBlockHashes(
  ops: readonly APIOperation[],
): Promise<Map<number, string>> {
  const missingLevels = new Set<number>();
  for (const op of ops) {
    if (isAPIStakingType(op) && !op.block) missingLevels.add(op.level);
  }
  if (missingLevels.size === 0) return new Map();
  try {
    return await tzkt.getBlockHashesByLevels([...missingLevels]);
  } catch (err) {
    log("coin:tezos", "fetchMissingStakingBlockHashes: skipped on fetch error", {
      reason: String(err),
    });
    return new Map();
  }
}

function resolveBlockHash(
  operation: ConvertibleOperation,
  stakingBlockHashes: Map<number, string>,
): string {
  const fromOp = typeof operation.block === "string" ? operation.block : operation.block?.hash;
  return fromOp ?? stakingBlockHashes.get(operation.level) ?? "";
}

function resolveTargetAddress(operation: ConvertibleOperation): string | undefined {
  if (isAPITransactionType(operation)) return operation.target?.address;
  if (isAPIDelegationType(operation)) {
    return operation.newDelegate?.address || operation.prevDelegate?.address;
  }
  if (isAPIStakingType(operation)) return operation.baker?.address;
  return undefined;
}

// finalize_unstake's protocol sender is the gas payer (anyone may call it),
// not the staker; map staking ops from the staker's perspective so the op
// stays visible in their wallet.
function resolveStakingAddresses(op: APIStakingType): {
  senders: string[];
  recipients: string[];
} {
  const stakerAddr = op.staker?.address ?? op.sender?.address;
  const bakerAddr = op.baker?.address;
  const stakerArr = stakerAddr ? [stakerAddr] : [];
  const bakerArr = bakerAddr ? [bakerAddr] : [];
  if (op.action === "finalize") return { senders: bakerArr, recipients: stakerArr };
  return { senders: stakerArr, recipients: bakerArr };
}

function resolveNormalizedType(
  operation: ConvertibleOperation,
  address: string,
  targetAddress: string | undefined,
  amount: bigint,
): Operation["type"] {
  if (isAPIDelegationType(operation)) {
    return operation.newDelegate?.address ? "DELEGATE" : "UNDELEGATE";
  }
  if (isAPIStakingType(operation)) return STAKING_ACTION_TO_OP_TYPE[operation.action];
  if (isAPIRevealType(operation)) return "REVEAL";
  if (!isAPITransactionType(operation)) {
    log("coin:tezos", "(logic/operations): Unknown operation type, defaulting to OUT");
    return "OUT";
  }
  const isOut = operation.sender?.address === address;
  const isIn = targetAddress === address;
  if ((isOut && isIn) || amount === 0n) return "FEES";
  if (isOut) return "OUT";
  if (isIn) return "IN";
  return "OUT";
}

function getLedgerOpType(
  operation: ConvertibleOperation,
  normalizedType: Operation["type"],
): string | undefined {
  if (isAPIDelegationType(operation)) {
    return operation.newDelegate?.address ? "DELEGATE" : "UNDELEGATE";
  } else if (isAPIRevealType(operation)) {
    return "REVEAL";
  } else if (isAPIStakingType(operation)) {
    return STAKING_ACTION_TO_OP_TYPE[operation.action];
  } else if (normalizedType === "FEES") {
    return "FEES";
  }
  return undefined;
}

function convertOperation(
  address: string,
  operation: ConvertibleOperation,
  stakingBlockHashes: Map<number, string>,
): Operation {
  const { hash, sender, id } = operation;

  // For transactions, the initiator (if present) is the fee payer (internal/sub-operations triggered by contracts).
  // Otherwise, the sender is the fee payer. For delegation/reveal/staking there is no initiator; sender is the fee payer.
  const feesPayer = isAPITransactionType(operation)
    ? operation.initiator?.address ?? sender?.address
    : sender?.address;

  const targetAddress = resolveTargetAddress(operation);
  // reveal has no target by design; staking resolves senders/recipients separately.
  if (!targetAddress && !isAPIRevealType(operation) && !isAPIStakingType(operation)) {
    log("coin:tezos", "(logic/operations): No target address found for operation", operation);
  }

  const { senders, recipients } = isAPIStakingType(operation)
    ? resolveStakingAddresses(operation)
    : {
        senders: sender?.address ? [sender.address] : [],
        recipients: targetAddress ? [targetAddress] : [],
      };

  const amount =
    isAPIRevealType(operation) || isAPIDelegationType(operation) ? 0n : BigInt(operation.amount);

  const fee =
    BigInt(operation.storageFee ?? 0) +
    BigInt(operation.bakerFee ?? 0) +
    BigInt(operation.allocationFee ?? 0);

  const normalizedType = resolveNormalizedType(operation, address, targetAddress, amount);

  // Tezos uses "applied" for every success operation (something else=failed )
  const hasFailed = operation.status && operation.status !== "applied";

  return {
    id: `${hash ?? ""}-${id}`,
    asset: { type: "native" },
    tx: {
      // hash id defined nullable in the tzkt API, but I wonder when it would be null ?
      hash: hash ?? "",
      // storageFee for transaction is always present
      fees: BigInt(fee ?? 0),
      ...(feesPayer ? { feesPayer } : {}),
      block: {
        hash: resolveBlockHash(operation, stakingBlockHashes),
        height: operation.level,
        time: new Date(operation.timestamp),
      },
      date: new Date(operation.timestamp),
      failed: hasFailed ?? false,
    },
    type: normalizedType,
    value: amount,
    senders: senders,
    recipients: recipients,
    details: {
      counter: operation.counter,
      gasLimit: operation.gasLimit,
      storageLimit: operation.storageLimit,
      ledgerOpType: getLedgerOpType(operation, normalizedType),
    },
  };
}

function convertTokenOperation(
  address: string,
  transfer: APITokenTransfer & { hash: string; block?: string },
  parent?: APITransactionType,
): Operation {
  const isOut = transfer.from?.address === address;
  const isIn = transfer.to?.address === address;
  let type: Operation["type"] = "FEES";
  if (isOut && !isIn) {
    type = "OUT";
  } else if (isIn && !isOut) {
    type = "IN";
  }

  const fee = parent
    ? BigInt(parent.storageFee ?? 0) +
      BigInt(parent.bakerFee ?? 0) +
      BigInt(parent.allocationFee ?? 0)
    : 0n;
  const feesPayer = parent?.initiator?.address ?? parent?.sender?.address;

  const tokenId = transfer.token.tokenId ?? "0";
  const assetReference = `${transfer.token.contract.address}:${tokenId}`;

  return {
    id: `${transfer.hash}-token-${transfer.id}`,
    type,
    senders: transfer.from?.address ? [transfer.from.address] : [],
    recipients: transfer.to?.address ? [transfer.to.address] : [],
    value: BigInt(transfer.amount),
    asset: {
      type: transfer.token.standard,
      assetReference,
      assetOwner: address,
      unit: {
        magnitude: Number.parseInt(transfer.token.metadata?.decimals ?? "0", 10),
        name: transfer.token.metadata?.name ?? "",
        code: transfer.token.metadata?.symbol ?? "",
      },
    },
    tx: {
      hash: transfer.hash,
      fees: fee,
      ...(feesPayer ? { feesPayer } : {}),
      block: {
        hash: transfer.block ?? parent?.block ?? "",
        height: transfer.level,
        time: new Date(transfer.timestamp),
      },
      date: new Date(transfer.timestamp),
      failed: parent ? Boolean(parent.status && parent.status !== "applied") : false,
    },
    details: {
      ledgerOpType: type,
      assetAmount: transfer.amount,
      assetSenders: transfer.from?.address ? [transfer.from.address] : [],
      assetRecipients: transfer.to?.address ? [transfer.to.address] : [],
      parentSenders: parent?.sender?.address ? [parent.sender.address] : [],
      parentRecipients: parent?.target?.address ? [parent.target.address] : [],
    },
  };
}
