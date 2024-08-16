export type ElrondAddress = {
  publicKey: string;
  address: string;
};

export type ElrondSignature = {
  signature: null | Buffer;
};

export interface ElrondSigner {
  getAddress(path: string, boolDisplay?: boolean): Promise<ElrondAddress>;
  setAddress(path: string, boolDisplay?: boolean): Promise<void>;
  sign(path: string, message: string): Promise<ElrondSignature>;
  provideESDTInfo(
    ticker?: string,
    id?: string,
    decimals?: number,
    chainId?: string,
    signature?: string,
  ): Promise<any>;
}
