import { LedgerEthTransactionResolution } from "@ledgerhq/hw-app-eth/lib/services/types";

export type CeloAddress = {
  publicKey: string;
  address: string;
};
export type CeloSignature = {
  signature: null | Buffer;
};
export interface CeloSigner {
  getAddress(path: string, boolDisplay?: boolean): Promise<CeloAddress>;
  signTransaction(path: string, rawTxHex: string): Promise<CeloSignature>;
}
