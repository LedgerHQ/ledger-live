export type SolanaAddress = {
  address: Buffer;
};
export type SolanaSignature = {
  signature: Buffer;
};
export interface SolanaSigner {
  getAddress(path: string, display?: boolean): Promise<SolanaAddress>;
  signTransaction(path: string, txBuffer: Buffer): Promise<SolanaSignature>;
}
