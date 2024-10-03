export type MultiversXAddress = {
  publicKey: string;
  address: string;
};

export type MultiversXSignature = {
  signature: null | Buffer;
};

export interface MultiversXSigner {
  getAddress(path: string, boolDisplay?: boolean): Promise<MultiversXAddress>;
  setAddress(path: string, boolDisplay?: boolean): Promise<void>;
  sign(path: string, message: string): Promise<MultiversXSignature>;
  provideESDTInfo(
    ticker?: string,
    id?: string,
    decimals?: number,
    chainId?: string,
    signature?: string,
  ): Promise<any>;
}
