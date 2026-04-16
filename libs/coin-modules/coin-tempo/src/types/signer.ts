export type TempoAddress = {
  publicKey: string;
  address: string;
};

export type TempoSignature = string;

export interface TempoSigner {
  getAddress(path: string, boolDisplay?: boolean): Promise<TempoAddress>;
  signTransaction(path: string, rawTxHex: string): Promise<TempoSignature>;
}
