import type { TransactionStatusCommon } from "@ledgerhq/types-live";
import type { Transaction } from "@mysten/sui/transactions";
import type { AccountInfoResponse } from "../../types";

export type Config = {
  readonly endpoint: string;
};

export type ChainAPI = Readonly<{
  getBalance: (address: string) => Promise<number>;
  getLatestBlockhash: () => Promise<string>;
  getFeeForMessage: (message: Transaction) => Promise<number | null>;
  getAccountInfo: (address: string) => Promise<AccountInfoResponse>;
  sendRawTransaction: (transaction: Transaction) => Promise<string>;
  getTransactionStatus: (signature: string) => Promise<TransactionStatusCommon>;
  config: Config;
}>;
