export type NearAddress = {
  publicKey: string;
  address: string;
};
export type NearSignature = Buffer | undefined;
export interface NearSigner {
  getAddress(path: string, verify?: boolean): Promise<NearAddress>;
  signTransaction(transaction: Uint8Array, path: string): Promise<NearSignature>;
}
