export type SuiAddress = {
  pubKey: string;
  address: string;
  return_code: number;
};
export type SuiSignature = {
  signature: null | string;
  return_code: number;
};
/** Minimal signer interface compatible with Sui and test mocks */
export interface SuiSigner {
  getPublicKey(path: string, verify?: boolean): Promise<SuiAddress>;
  signTransaction(
    path: string,
    signData: Uint8Array,
    options?: { useLedgerTimestamp?: boolean },
  ): Promise<SuiSignature>;
  getVersion(): Promise<{ version: string }>;
}
