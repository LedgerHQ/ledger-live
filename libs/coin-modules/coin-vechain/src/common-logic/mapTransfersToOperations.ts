import BigNumber from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { EventLog, TransferLog } from "../types";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { getFees } from "../network/getFees";
import type { VechainCurrencyConfig } from "../config";
import { decodeVip180Transfer } from "./vip180";

export const mapVetTransfersToOperations = async (
  config: VechainCurrencyConfig,
  txs: TransferLog[],
  accountId: string,
  addr: string,
): Promise<Operation[]> => {
  return Promise.all(
    txs.map(async tx => {
      const fees = await getFees(config, tx.meta.txID);
      return {
        id: encodeOperationId(
          accountId,
          tx.meta.txID,
          tx.recipient.toLowerCase() === addr.toLowerCase() ? "IN" : "OUT",
        ),
        hash: tx.meta.txID,
        type: tx.recipient.toLowerCase() === addr.toLowerCase() ? "IN" : "OUT",
        value: new BigNumber(tx.amount),
        fee: new BigNumber(fees),
        senders: [tx.sender.toLowerCase()],
        recipients: [tx.recipient.toLowerCase()],
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
  config: VechainCurrencyConfig,
  events: EventLog[],
  accountId: string,
  addr: string,
): Promise<Operation[]> => {
  return Promise.all(
    events.map(async event => {
      const { from, to, value } = decodeVip180Transfer(event);
      const type = to === addr.toLowerCase() ? "IN" : "OUT";
      const fees = await getFees(config, event.meta.txID);
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
