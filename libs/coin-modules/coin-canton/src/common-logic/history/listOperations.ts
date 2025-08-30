import type { Operation, Pagination } from "@ledgerhq/coin-framework/api/index";
import { CreatedEvent, getTransactions, TxInfo } from "../../network/gateway";
import coinConfig from "../../config";

const getNativeContractId = () =>
  coinConfig.getCoinConfig().nativeInstrumentId !== undefined
    ? coinConfig.getCoinConfig().nativeInstrumentId?.split(".")[0]
    : "";

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
  const { transactions, next } = await getTransactions(partyId, {
    cursor: page.pagingToken !== undefined ? parseInt(page.pagingToken) : undefined,
    minOffset: page.minHeight,
    limit: page.limit,
  });
  const ops: Operation[] = [];
  for (const tx of transactions) {
    for (let i = 0; i < tx.events.length; i++) {
      const event: CreatedEvent = tx.events[i]["CantonCreatedEvent"] as CreatedEvent;
      if (event && event.template_id.module_name === "Splice.Amulet") {
        ops.push({
          id: tx.update_id + "-" + i,
          type: event.signatories.includes(partyId) ? "OUT" : "IN",
          value: BigInt(0), // to be finalized when details are available on backend
          senders: event.signatories.includes(partyId) ? [partyId] : [],
          recipients: event.signatories.includes(partyId) ? [] : [partyId],
          asset:
            event.contract_id === getNativeContractId()
              ? { type: "native" }
              : { type: "token", assetReference: event.contract_id },
          tx: {
            hash: tx.update_id,
            fees: BigInt(0), // to be finalized when details are available on backend
            date: new Date(tx.record_time.seconds),
            block: {
              height: tx.offset,
              time: new Date(tx.effective_at.seconds),
            },
          },
        });
      }
    }
  }
  return [ops, next + ""];
}
