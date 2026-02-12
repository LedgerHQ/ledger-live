import { broadcastTransaction, getAccount, getTransactionParams } from "./algodv2";
import { AlgoAccount, AlgoTransactionParams } from "./algodv2.types";

import { getAccountTransactions } from "./indexer";
import { AlgoTransaction } from "./indexer.types";

export * from "./algodv2.types";
export * from "./indexer.types";

export default {
  getAccount: async (address: string): Promise<AlgoAccount> => getAccount(address),

  getTransactionParams: async (): Promise<AlgoTransactionParams> => getTransactionParams(),

  broadcastTransaction: async (payload: Buffer): Promise<string> => broadcastTransaction(payload),

  getAccountTransactions: async (address: string, startAt?: number): Promise<AlgoTransaction[]> =>
    getAccountTransactions(address, startAt),
};
