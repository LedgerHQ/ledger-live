import { NetworkRequestCall } from "@ledgerhq/coin-framework/network";
import { AlgoAccount, AlgoTransactionParams } from "./algodv2.types";

import {
  broadcastTransaction as sidecardBroadcastTransaction,
  getAccount as sidecardGetAccount,
  getTransactionParams as sidecardGetTransactionParams,
} from "./algodv2";

import { getAccountTransactions as sidecardGetAccountTransactions } from "./indexer";
import { AlgoTransaction } from "./indexer.types";

export * from "./algodv2.types";
export * from "./indexer.types";

export class AlgorandAPI {
  network: NetworkRequestCall;

  constructor(network: NetworkRequestCall) {
    this.network = network;
  }

  async getAccount(address: string): Promise<AlgoAccount> {
    return sidecardGetAccount(this.network)(address);
  }

  async getTransactionParams(): Promise<AlgoTransactionParams> {
    return sidecardGetTransactionParams(this.network)();
  }

  async broadcastTransaction(payload: Buffer): Promise<string> {
    return sidecardBroadcastTransaction(this.network)(payload);
  }

  async getAccountTransactions(
    address: string,
    startAt?: number
  ): Promise<AlgoTransaction[]> {
    return sidecardGetAccountTransactions(this.network)(address, startAt);
  }
}
