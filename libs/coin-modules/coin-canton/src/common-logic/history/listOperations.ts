import type { Operation, Pagination } from "@ledgerhq/coin-framework/api/index";
import { getOperations } from "../../network/gateway";
import coinConfig from "../../config";

/**
 * Returns list of operations associated to an account.
 * @param partyId Account partyId
 * @param pagination Pagination options
 * @returns Operations found and the next "id" or "index" to use for pagination (i.e. `start` property).\
 * Impl to finalize when backend is ready
 */
export async function listOperations(
  partyId: string,
  page: Pagination,
): Promise<[Operation[], string]> {
  const { operations, next } = await getOperations(partyId, {
    cursor: page.pagingToken !== undefined ? parseInt(page.pagingToken) : undefined,
    minOffset: page.minHeight,
    limit: page.limit,
  });
  const ops: Operation[] = [];
  for (const tx of operations) {
    if (tx.type === "Send") {
      ops.push({
        id: tx.uid,
        type: tx.senders.includes(partyId) ? "OUT" : "IN",
        value: BigInt(tx.transfers[0].value),
        senders: tx.senders,
        recipients: tx.recipients,
        asset: tx.asset,
        tx: {
          hash: tx.block.hash,
          fees: BigInt(tx.fee.value),
          date: new Date(tx.transaction_timestamp),
          block: {
            height: tx.block.height,
            time: new Date(tx.block.time),
          },
        },
      });
    }
  }
  return [ops, next + ""];
}
