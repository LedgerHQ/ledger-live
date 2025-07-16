import BigNumber from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { EventLog, TransferLog } from "../types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getFees } from "../network";
import { ABIEvent, Hex, VIP180_ABI } from "@vechain/sdk-core";

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
  events: EventLog[],
  accountId: string,
  addr: string,
): Promise<Operation[]> => {
  return Promise.all(
    events.map(async event => {
      const decoded = ABIEvent.parseLog(VIP180_ABI, {
        data: Hex.of(event.data),
        topics: event.topics.map(topic => Hex.of(topic)),
      }) as {
        eventName: "Transfer";
        args: {
          from: string;
          to: string;
          value: bigint;
        };
      };
      const from = decoded.args.from;
      const to = decoded.args.to;
      const value = decoded.args.value;
      const type = to === addr.toLowerCase() ? "IN" : "OUT";
      const fees = await getFees(event.meta.txID);
      return {
        id: encodeOperationId(accountId, event.meta.txID, type),
        hash: event.meta.txID,
        type,
        value: new BigNumber(value.toString()),
        fee: fees,
        senders: [from],
        recipients: [to],
        blockHeight: event.meta.blockNumber,
        blockHash: event.meta.blockID,
        accountId,
        date: new Date(event.meta.blockTimestamp * 1000),
        extra: {},
      };
    }),
  );
};
