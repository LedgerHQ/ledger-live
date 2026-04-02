import { Operation } from "@ledgerhq/coin-module-framework/api/types";
import { log } from "@ledgerhq/logs";
import { tzkt } from "../network";
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

/** Cursor: native + token transfer last ids. Legacy: JSON number = native only. */
function parseCursor(token?: string): { nativeLastId?: number; tokenLastId?: number } {
  if (!token) return {};
  try {
    const parsed: unknown = JSON.parse(token);
    if (typeof parsed === "number") return { nativeLastId: parsed };
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const output = parsed as { n?: unknown; t?: unknown };
      return {
        nativeLastId: typeof output.n === "number" ? output.n : undefined,
        tokenLastId: typeof output.t === "number" ? output.t : undefined,
      };
    }
  } catch {
    // ignore invalid cursor
  }
  return {};
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
  const { nativeLastId, tokenLastId } = parseCursor(token);

  let nativeOptions: AccountsGetOperationsOptions = { limit, sort, "level.ge": minHeight };
  if (nativeLastId !== undefined) {
    nativeOptions = { ...nativeOptions, lastId: nativeLastId };
  }

  const tokenOptions = {
    limit,
    sort,
    "level.ge": minHeight,
    ...(tokenLastId !== undefined ? { lastId: tokenLastId } : {}),
  };

  const [nativeOps, tokenTransfers] = await Promise.all([
    tzkt.getAccountOperations(address, nativeOptions),
    tzkt.getAccountTokenTransfers(address, tokenOptions),
  ]);

  // Apply limit after fetching since tzkt API might not respect the limit parameter
  const limitedNativeOps = limit ? nativeOps.slice(0, limit) : nativeOps;
  const limitedTokenTransfers = limit ? tokenTransfers.slice(0, limit) : tokenTransfers;

  const parentMap = new Map<number, APITransactionType>();
  for (const op of nativeOps) {
    if (isAPITransactionType(op) && op.id !== null) {
      parentMap.set(op.id, op);
    }
  }

  const lastNativeOp = limitedNativeOps.at(-1);
  const lastTokenOp = limitedTokenTransfers.at(-1);
  const nextToken =
    lastNativeOp || lastTokenOp ? JSON.stringify({ n: lastNativeOp?.id, t: lastTokenOp?.id }) : "";

  const filteredNativeOps = limitedNativeOps
    .filter(op => isAPITransactionType(op) || isAPIDelegationType(op) || isAPIRevealType(op))
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

  const tokenConverted = limitedTokenTransfers.map(token =>
    convertTokenOperation(
      address,
      token,
      token.transactionId !== null ? parentMap.get(token.transactionId || 0) : undefined,
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
  transfer: APITokenTransfer & { hash: string },
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
        hash: parent?.block ?? "",
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
