import { tzkt } from "../network";
import { log } from "@ledgerhq/logs";
import {
  type APIDelegationType,
  type APIRevealType,
  type APITransactionType,
  AccountsGetOperationsOptions,
  isAPIDelegationType,
  isAPIRevealType,
  isAPITransactionType,
} from "../network/types";
import { Operation } from "@ledgerhq/coin-framework/api/types";
import { TezosAsset } from "../api/types";

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
): Promise<[Operation<TezosAsset>[], string]> {
  let options: AccountsGetOperationsOptions = { limit, sort, "level.ge": minHeight };
  if (token) {
    options = { ...options, lastId: JSON.parse(token) };
  }
  const operations = await tzkt.getAccountOperations(address, options);
  const lastOperation = operations.slice(-1)[0];
  // it's important to get the last id from the **unfiltered** operation list
  // otherwise we might miss operations
  const nextToken = lastOperation ? JSON.stringify(lastOperation?.id) : "";
  const filteredOperations = operations
    .filter(op => isAPITransactionType(op) || isAPIDelegationType(op) || isAPIRevealType(op))
    .reduce((acc, op) => acc.concat(convertOperation(address, op)), [] as Operation<TezosAsset>[]);
  if (sort === "Ascending") {
    //results are always sorted in descending order
    filteredOperations.reverse();
  }
  return [filteredOperations, nextToken];
}

// note that "initiator" of APITransactionType is never used in the conversion
function convertOperation(
  address: string,
  operation: APITransactionType | APIDelegationType | APIRevealType,
): Operation<TezosAsset> {
  const { hash, sender, type, id } = operation;

  let targetAddress = undefined;
  if (isAPITransactionType(operation)) {
    targetAddress = operation?.target?.address;
  } else if (isAPIDelegationType(operation)) {
    // delegate and undelegate has the type, but hold the address in different fields
    targetAddress = operation?.newDelegate?.address || operation?.prevDelegate?.address;
  }

  const recipients = [];
  if (!targetAddress) {
    log("coin:tezos", "(logic/operations): No target address found for operation", operation);
  } else {
    recipients.push(targetAddress);
  }

  const senders = sender?.address ? [sender.address] : [];

  const amount = isAPIRevealType(operation) ? BigInt(0) : BigInt(operation.amount);

  const fee =
    BigInt(operation.storageFee ?? 0) +
    BigInt(operation.bakerFee ?? 0) +
    BigInt(operation.allocationFee ?? 0);

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
    },
    type: type,
    value: amount,
    senders: senders,
    recipients: recipients,
    details: {
      counter: operation.counter,
      gasLimit: operation.gasLimit,
      storageLimit: operation.storageLimit,
    },
  };
}
