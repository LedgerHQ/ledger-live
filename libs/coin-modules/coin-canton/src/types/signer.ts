export type CantonAddress = {
  publicKey: string;
  address: string;
};

export type CantonSignature = string; // `0x${string}`

export interface CantonSigner {
  getAddress(path: string): Promise<CantonAddress>;
  signTransaction(path: string, rawTx: string): Promise<CantonSignature>;
}
