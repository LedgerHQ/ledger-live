import { Operation } from "@ledgerhq/coin-module-framework/api/types";
import { log } from "@ledgerhq/logs";
import { tzkt } from "../network";
import type { APIOperation } from "../network/types";
import {
  type APIDelegationType,
  type APIRevealType,
  type APITokenTransfer,
  type APITransactionType,
  AccountsGetOperationsOptions,
  isAPIDelegationType,
  isAPIRevealType,
  isAPITransactionType,
} from "../network/types";

/** Single block-level boundary cursor shared by native + token streams (legacy cursors ignored). */
type ListOperationsCursor = { lastLevel: number };

function parseCursor(token?: string): ListOperationsCursor | undefined {
  if (!token) return undefined;
  try {
    const parsed: unknown = JSON.parse(token);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const o = parsed as { lastLevel?: unknown };
      if (typeof o.lastLevel === "number" && Number.isFinite(o.lastLevel)) {
        return { lastLevel: o.lastLevel };
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
function trimPartialLastLevel<T extends { level: number }>(items: T[], full: boolean): T[] {
  if (!full || items.length === 0) return items;
  const lastLevel = items[items.length - 1].level;
  const filtered = items.filter(op => op.level !== lastLevel);
  if (filtered.length === 0) {
    log("coin:tezos", "listOperations: full page single level — keeping all rows", {
      lastLevel,
      count: items.length,
    });
    return items;
  }
  return filtered;
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

  const levelWindow =
    sort === "Descending"
      ? ({
          "level.ge": minHeight,
          ...(cursor ? { "level.lt": cursor.lastLevel } : {}),
        } as const)
      : ({
          "level.ge": cursor ? Math.max(minHeight, cursor.lastLevel + 1) : minHeight,
        } as const);

  const nativeOptions: AccountsGetOperationsOptions = {
    limit,
    sort,
    ...levelWindow,
  };

  const tokenOptions = {
    limit,
    sort,
    ...levelWindow,
  };

  const [nativeOpsRaw, tokenTransfersRaw] = await Promise.all([
    tzkt.getAccountOperations(address, nativeOptions),
    tzkt.getAccountTokenTransfers(address, tokenOptions),
  ]);

  const nativeSliced = limit !== undefined ? nativeOpsRaw.slice(0, limit) : nativeOpsRaw;
  const tokenSliced = limit !== undefined ? tokenTransfersRaw.slice(0, limit) : tokenTransfersRaw;

  const nativeFull = limit !== undefined && nativeOpsRaw.length >= limit;
  const tokenFull = limit !== undefined && tokenTransfersRaw.length >= limit;

  const nativeTrim = trimPartialLastLevel(nativeSliced, nativeFull);
  const tokenTrim = trimPartialLastLevel(tokenSliced, tokenFull);

  const boundary = computeBoundary(nativeTrim, tokenTrim, sort);

  const nativeAligned =
    boundary !== undefined ? alignToBoundary(nativeTrim, boundary, sort) : nativeTrim;
  const tokenAligned =
    boundary !== undefined ? alignToBoundary(tokenTrim, boundary, sort) : tokenTrim;

  const parentMap = new Map<number, APITransactionType>();
  for (const op of nativeAligned) {
    if (isAPITransactionType(op) && op.id !== null) {
      parentMap.set(op.id, op);
    }
  }

  const shouldEmitNext =
    boundary !== undefined &&
    (nativeFull || tokenFull) &&
    (nativeAligned.length > 0 || tokenAligned.length > 0);

  const nextToken = shouldEmitNext
    ? JSON.stringify({ lastLevel: boundary } satisfies ListOperationsCursor)
    : "";

  const filteredNativeOps = nativeAligned
    .filter(
      (op: APIOperation) =>
        isAPITransactionType(op) || isAPIDelegationType(op) || isAPIRevealType(op),
    )
    .filter(op => {
      const hasFailed = op.status !== "applied";
      if (hasFailed && isAPITransactionType(op)) {
        const isIn = op.target?.address === address;
        if (isIn) {
          return false;
        }
      }
      return true;
    })
    .map(op => convertOperation(address, op))
    .flat();

  const tokenConverted = tokenAligned.map(transfer =>
    convertTokenOperation(
      address,
      transfer,
      transfer.transactionId ? parentMap.get(transfer.transactionId) : undefined,
    ),
  );

  const sortedOperations = [...filteredNativeOps, ...tokenConverted].sort(
    (a, b) => b.tx.date.getTime() - a.tx.date.getTime(),
  );
  return [sortedOperations, nextToken];
}

/**
 * Helper function to get the ledgerOpType for an operation
 */
function getLedgerOpType(
  operation: APITransactionType | APIDelegationType | APIRevealType,
  normalizedType: Operation["type"],
): string | undefined {
  if (isAPIDelegationType(operation)) {
    return operation.newDelegate?.address ? "DELEGATE" : "UNDELEGATE";
  } else if (isAPIRevealType(operation)) {
    return "REVEAL";
  } else if (normalizedType === "FEES") {
    return "FEES";
  }
  return undefined;
}

function convertOperation(
  address: string,
  operation: APITransactionType | APIDelegationType | APIRevealType,
): Operation {
  const { hash, sender, id } = operation;

  // For transactions, the initiator (if present) is the fee payer (internal/sub-operations triggered by contracts).
  // Otherwise, the sender is the fee payer. For delegation/reveal there is no initiator; sender is the fee payer.
  const feesPayer = isAPITransactionType(operation)
    ? (operation.initiator?.address ?? sender?.address)
    : sender?.address;

  let targetAddress = undefined;
  if (isAPITransactionType(operation)) {
    targetAddress = operation?.target?.address;
  } else if (isAPIDelegationType(operation)) {
    // delegate and undelegate has the type, but hold the address in different fields
    targetAddress = operation?.newDelegate?.address || operation?.prevDelegate?.address;
  }

  const recipients = targetAddress ? [targetAddress] : [];
  if (!targetAddress) {
    log("coin:tezos", "(logic/operations): No target address found for operation", operation);
  }

  const senders = sender?.address ? [sender.address] : [];

  const amount =
    isAPIRevealType(operation) || isAPIDelegationType(operation) ? 0n : BigInt(operation.amount);

  const fee =
    BigInt(operation.storageFee ?? 0) +
    BigInt(operation.bakerFee ?? 0) +
    BigInt(operation.allocationFee ?? 0);

  // Determine operation type inline
  let normalizedType: Operation["type"];
  if (isAPIDelegationType(operation)) {
    normalizedType = operation.newDelegate?.address ? "DELEGATE" : "UNDELEGATE";
  } else if (isAPITransactionType(operation)) {
    const isOut = sender?.address === address;
    const isIn = targetAddress === address;

    if ((isOut && isIn) || amount === 0n) {
      normalizedType = "FEES";
    } else if (isOut) {
      normalizedType = "OUT";
    } else if (isIn) {
      normalizedType = "IN";
    } else {
      normalizedType = "OUT"; // fallback
    }
  } else if (isAPIRevealType(operation)) {
    normalizedType = "REVEAL";
  } else {
    // fallback for unknown types
    log("coin:tezos", "(logic/operations): Unknown operation type, defaulting to OUT");
    normalizedType = "OUT";
  }

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
        hash: operation.block,
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

  const assetReference = transfer.token.contract.address;

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
