export type CantonAddress = {
  publicKey: string;
  address: string;
  path: string; // TODO: check if necessary
};

export type CantonSignature = string; // `0x${string}`

export interface CantonSigner {
  getAddress(path: string, display?: boolean): Promise<CantonAddress>;
  signTransaction(path: string, rawTx: string): Promise<CantonSignature>;
}
