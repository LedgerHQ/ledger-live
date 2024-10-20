import { KaspaTransaction, KaspaTransactionInput, KaspaTransactionOutput } from "../types/bridge";

export const createTransaction = (): KaspaTransaction => ({
  locktime: 0,
  inputs: Array<KaspaTransactionInput>(),
  outputs: Array<KaspaTransactionOutput>(),
  subnetworkId: "0000000000000000000000000000000000000000",
  version: 0,
});

export default createTransaction;
