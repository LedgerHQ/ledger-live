export type MultiversxAddress = {
  publicKey: string;
  address: string;
};

export type MultiversxSignature = {
  signature: null | Buffer;
};

export interface MultiversxSigner {
  getAddress(path: string, boolDisplay?: boolean): Promise<MultiversxAddress>;
  setAddress(path: string, boolDisplay?: boolean): Promise<void>;
  sign(path: string, message: string): Promise<MultiversxSignature>;
  provideESDTInfo(
    ticker?: string,
    id?: string,
    decimals?: number,
    chainId?: string,
    signature?: string,
  ): Promise<any>;
}
