type AlgorandAddress = {
  publicKey: string;
  address: string;
};

export interface AlgorandSigner {
  getAddress(path: string, boolDisplay?: boolean): Promise<AlgorandAddress>;
  sign(
    path: string,
    message: string
  ): Promise<{
    signature: null | Buffer;
  }>;
}
