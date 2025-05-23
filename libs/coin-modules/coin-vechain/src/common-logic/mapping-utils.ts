import BigNumber from "bignumber.js";
import { VIP180 } from "../contracts/abis/VIP180";
import { Operation } from "@ledgerhq/types-live";
import { EventLog, TransferLog } from "../types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getFees } from "../network";
import { Hex } from "@vechain/sdk-core";

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
      const decoded = VIP180.TransferEvent.decodeEventLog({
        topics: evnt.topics.map(topic => Hex.of(topic)),
        data: Hex.of(evnt.data),
      });
      const from = decoded.args?.[0];
      const to = decoded.args?.[1];
      const value = decoded.args?.[2];
      const type = to === addr.toLowerCase() ? "IN" : "OUT";
      const fees = await getFees(evnt.meta.txID);
      return {
        id: encodeOperationId(accountId, evnt.meta.txID, type),
        hash: evnt.meta.txID,
        type,
        value: new BigNumber(value as string),
        fee: fees,
        senders: [from as string],
        recipients: [to as string],
        blockHeight: evnt.meta.blockNumber,
        blockHash: evnt.meta.blockID,
        accountId,
        date: new Date(evnt.meta.blockTimestamp * 1000),
        extra: {},
      };
    }),
  );
};
