import vip180 from "../contracts/abis/VIP180";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { EventLog, TransferLog } from "../api/types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getFees } from "../api";

export const mapVetTransfersToOperations = async (
  txs: TransferLog[],
  accountId: string,
  addr: string,
): Promise<Operation[]> => {
  return Promise.all(
    txs.map(async tx => {
      const fees = await getFees(tx.meta.txID);
      return {
        id: encodeOperationId(
          accountId,
          tx.meta.txID,
          tx.recipient === addr.toLowerCase() ? "IN" : "OUT",
        ),
        hash: tx.meta.txID,
        type: tx.recipient === addr.toLowerCase() ? "IN" : "OUT",
        value: new BigNumber(tx.amount),
        fee: new BigNumber(fees),
        senders: [tx.sender],
        recipients: [tx.recipient],
        blockHeight: tx.meta.blockNumber,
        blockHash: tx.meta.blockID,
        accountId,
        date: new Date(tx.meta.blockTimestamp * 1000),
        extra: {},
      };
    }),
  );
};

export const mapTokenTransfersToOperations = async (
  evnts: EventLog[],
  accountId: string,
  addr: string,
): Promise<Operation[]> => {
  return Promise.all(
    evnts.map(async evnt => {
      const decoded = vip180.TransferEvent.decode(evnt.data, evnt.topics);
      const fees = await getFees(evnt.meta.txID);
      return {
        id: encodeOperationId(
          accountId,
          evnt.meta.txID,
          decoded.to === addr.toLowerCase() ? "IN" : "OUT",
        ),
        hash: evnt.meta.txID,
        type: decoded.to === addr.toLowerCase() ? "IN" : "OUT",
        value: new BigNumber(decoded.value),
        fee: fees,
        senders: [decoded.from],
        recipients: [decoded.to],
        blockHeight: evnt.meta.blockNumber,
        blockHash: evnt.meta.blockID,
        accountId,
        date: new Date(evnt.meta.blockTimestamp * 1000),
        extra: {},
      };
    }),
  );
};
