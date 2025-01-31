import type { Transaction } from "@mysten/sui/transactions";

export type Config = {
  readonly endpoint: string;
};

export type ChainAPI = Readonly<{
  getBalance: (address: string) => Promise<number>;
  getLatestBlockhash: () => Promise<string>;
  getFeeForMessage: (message: Transaction) => Promise<number | null>;
  getAccountInfo: (address: string) => Promise<any>;
  sendRawTransaction: (transaction: Transaction) => Promise<string>;
  getTransactionStatus: (signature: string) => Promise<any>;
  config: Config;
}>;
