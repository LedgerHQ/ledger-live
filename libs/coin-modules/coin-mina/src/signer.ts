export type MinaAddress = {
  publicKey: string;
  address: string;
};
export type MinaSignature = Buffer | undefined;
export interface MinaSigner {
  getAddress(path: string, verify?: boolean): Promise<MinaAddress>;
  signTransaction(transaction: Uint8Array, path: string): Promise<MinaSignature>;
}
