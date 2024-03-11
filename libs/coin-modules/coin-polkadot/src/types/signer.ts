export type PolkadotAddress = {
  pubKey: string;
  address: string;
  return_code: number;
};
export type PolkadotSignature = {
  signature: null | string;
  return_code: number;
};
export interface PolkadotSigner {
  getAddress(path: string, verify?: boolean): Promise<PolkadotAddress>;
  sign(path: string, message: string): Promise<PolkadotSignature>;
}
