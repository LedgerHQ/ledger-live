export type KaspaAddress = {
  address: string;
  publicKey: string;
};
export type KaspaSignature = {
  signature: string;
};

export interface KaspaSigner {
  getAddress(path: string, display?: boolean): Promise<KaspaAddress>;
  signMessage(
    message: string,
    addressType?: 0 | 1,
    addressIndex?: number,
    account?: number,
  ): Promise<KaspaSignature>;
}
