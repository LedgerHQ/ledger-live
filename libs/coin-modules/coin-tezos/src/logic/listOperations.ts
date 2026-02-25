import { Operation } from "@ledgerhq/coin-framework/api/types";
import { log } from "@ledgerhq/logs";
import { tzkt } from "../network";
import {
  type APIDelegationType,
  type APIRevealType,
  type APITransactionType,
  AccountsGetOperationsOptions,
  isAPIDelegationType,
  isAPIRevealType,
  isAPITransactionType,
} from "../network/types";

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
  let options: AccountsGetOperationsOptions = { limit, sort, "level.ge": minHeight };
  if (token) {
    options = { ...options, lastId: JSON.parse(token) };
  }
  const operations = await tzkt.getAccountOperations(address, options);

  // Apply limit after fetching since tzkt API might not respect the limit parameter
  const limitedOperations = limit ? operations.slice(0, limit) : operations;

  const lastOperation = limitedOperations.at(-1);
  // it's important to get the last id from the **unfiltered** operation list
  // otherwise we might miss operations
  const nextToken = lastOperation ? JSON.stringify(lastOperation?.id) : "";
  const filteredOperations = limitedOperations
    .filter(op => isAPITransactionType(op) || isAPIDelegationType(op) || isAPIRevealType(op))
    .filter(op => {
      // Filter out failed incoming tx
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
  const sortedOperations = filteredOperations.sort(
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

// note that "initiator" of APITransactionType is never used in the conversion
function convertOperation(
  address: string,
  operation: APITransactionType | APIDelegationType | APIRevealType,
): Operation {
  const { hash, sender, id } = operation;

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
