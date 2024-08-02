export type ElrondAddress = {
  publicKey: string;
  address: string;
};

export type ElrondSignature = {
  signature: null | Buffer;
};

export interface ElrondSigner {
  getAddress(path: string, boolDisplay?: boolean): Promise<ElrondAddress>;
  sign(path: string, message: string): Promise<ElrondSignature>;
}
