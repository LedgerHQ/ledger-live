export type VechainAddress = {
  publicKey: string;
  address: string;
  chainCode?: string;
};
export type VechainSignature = Buffer;
export interface VechainSigner {
  getAddress(path: string, boolDisplay?: boolean, chainCode?: boolean): Promise<VechainAddress>;
  signTransaction(path: string, rawTxHex: string): Promise<VechainSignature>;
}
