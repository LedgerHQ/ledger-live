import type { AleoPublicTransaction, AleoPublicTransactionDetailsResponse } from "./api";

export type EnrichedTransaction = {
  rawTx: AleoPublicTransaction;
  details: AleoPublicTransactionDetailsResponse | null;
};
