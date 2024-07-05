export interface StellarSigner {
  getPublicKey(path: string, display?: boolean): Promise<{ rawPublicKey: Buffer }>;
  signTransaction(
    path: string,
    transaction: Buffer,
  ): Promise<{
    signature: Buffer;
  }>;
}
