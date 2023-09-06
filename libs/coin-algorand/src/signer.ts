export type AlgorandAddress = {
  publicKey: string;
  address: string;
};
export type AlgorandSignature = {
  signature: null | Buffer;
};
export interface AlgorandSigner {
  getAddress(path: string, boolDisplay?: boolean): Promise<AlgorandAddress>;
  sign(path: string, message: string): Promise<AlgorandSignature>;
}
