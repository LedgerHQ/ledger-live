export type HederaSignature = Uint8Array | undefined; // NOTE: check if undefined is possible
export interface HederaSigner {
  getPublicKey(path: string): Promise<string>;
  signTransaction(transaction: Uint8Array): Promise<HederaSignature>;
}