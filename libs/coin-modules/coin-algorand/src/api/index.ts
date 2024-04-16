import network from "@ledgerhq/live-network/network";
import { AlgoAccount, AlgoTransactionParams } from "./algodv2.types";

import { broadcastTransaction, getAccount, getTransactionParams } from "./algodv2";

import { getAccountTransactions } from "./indexer";
import { AlgoTransaction } from "./indexer.types";

export * from "./algodv2.types";
export * from "./indexer.types";

export default {
  getAccount: async (address: string): Promise<AlgoAccount> => getAccount(network)(address),

  getTransactionParams: async (): Promise<AlgoTransactionParams> => getTransactionParams(network)(),

  broadcastTransaction: async (payload: Buffer): Promise<string> =>
    broadcastTransaction(network)(payload),

  getAccountTransactions: async (address: string, startAt?: number): Promise<AlgoTransaction[]> =>
    getAccountTransactions(network)(address, startAt),
};
