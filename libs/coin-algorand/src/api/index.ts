import { NetworkRequestCall } from "@ledgerhq/coin-framework/network";
import { AlgoAccount, AlgoTransactionParams } from "./algodv2.types";

import { broadcastTransaction, getAccount, getTransactionParams } from "./algodv2";

import { getAccountTransactions } from "./indexer";
import { AlgoTransaction } from "./indexer.types";

export * from "./algodv2.types";
export * from "./indexer.types";

export class AlgorandAPI {
  network: NetworkRequestCall;

  constructor(network: NetworkRequestCall) {
    this.network = network;
  }

  async getAccount(address: string): Promise<AlgoAccount> {
    return getAccount(this.network)(address);
  }

  async getTransactionParams(): Promise<AlgoTransactionParams> {
    return getTransactionParams(this.network)();
  }

  async broadcastTransaction(payload: Buffer): Promise<string> {
    return broadcastTransaction(this.network)(payload);
  }

  async getAccountTransactions(address: string, startAt?: number): Promise<AlgoTransaction[]> {
    return getAccountTransactions(this.network)(address, startAt);
  }
}
