export type ZcashAddress = {
  publicKey: string;
  address: string;
};

export type ZcashSignature = string; // `0x${string}`

export interface ZcashSigner {
  getAddress(path: string): Promise<ZcashAddress>;
  signTransaction(path: string, rawTx: string): Promise<ZcashSignature>;
}
