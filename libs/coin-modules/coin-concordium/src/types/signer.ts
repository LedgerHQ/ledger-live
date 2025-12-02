export type ConcordiumAddress = {
  publicKey: string;
  address: string;
};

export type ConcordiumSignature = string; // `0x${string}`

export interface ConcordiumSigner {
  getAddress(path: string): Promise<ConcordiumAddress>;
  signTransaction(path: string, rawTx: string): Promise<ConcordiumSignature>;
}
