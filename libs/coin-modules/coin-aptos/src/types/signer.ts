export type AptosAddress = {
  address: string;
  publicKey: string;
  path: string;
};

export type AptosSignature = {
  signature: null | string;
  return_code: number;
};

export interface AptosSigner {
  getAddress(path: string, ss58prefix: number, showAddrInDevice?: boolean): Promise<AptosAddress>;
  sign(path: string, message: Uint8Array, metadata: string): Promise<AptosSignature>;
}
