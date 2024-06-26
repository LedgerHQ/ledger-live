export interface StellarSigner {
  getAppConfiguration(): Promise<{
    version: string;
    hashSigningEnabled: boolean;
    maxDataSize?: number;
  }>;
  getPublicKey(path: string, display?: boolean): Promise<{ rawPublicKey: Buffer }>;
  signTransaction(
    path: string,
    transaction: Buffer,
  ): Promise<{
    signature: Buffer;
  }>;
  signSorobanAuthorization(
    path: string,
    hashIdPreimage: Buffer,
  ): Promise<{
    signature: Buffer;
  }>;
  signHash(
    path: string,
    hash: Buffer,
  ): Promise<{
    signature: Buffer;
  }>;
}
