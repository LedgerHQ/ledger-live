export type TronAddress = {
  publicKey: string;
  address: string;
};
export type TronSignature = string;
export interface TronSigner {
  getAddress(path: string, boolDisplay?: boolean): Promise<TronAddress>;
  sign(path: string, rawTxHex: string, tokenSignatures: string[]): Promise<TronSignature>;
}
