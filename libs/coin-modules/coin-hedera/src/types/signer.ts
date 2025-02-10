export type HederaSignature = Uint8Array | undefined; // NOTE: check if undefined is possible
export interface HederaSigner {
  getPublicKey(path: string, ecdsa?: boolean): Promise<string>;
  signTransaction(transaction: Uint8Array, ecdsa?: boolean): Promise<Uint8Array>;
}

export type HederaSignatureSdk = Uint8Array;
