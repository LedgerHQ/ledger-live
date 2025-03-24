export type CeloAddress = {
  publicKey: string;
  address: string;
};
export type CeloSignature = {
  signature: null | Buffer;
};
export interface CeloSigner {
  getAddress(path: string, boolDisplay?: boolean): Promise<CeloAddress>;
  sign(path: string, message: string): Promise<CeloSignature>;
}
