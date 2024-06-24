import { TransactionSubset } from "./TransactionSubset";

export type TransactionContext = TransactionSubset & {
  challenge: string;
  domain?: string;
};
