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
  getAddress(
    path: string,
    ss58prefix: number,
    showAddrInDevice?: boolean,
    runtimeUpgraded?: boolean,
  ): Promise<PolkadotAddress>;
  sign(path: string, message: Uint8Array, metadata: string): Promise<PolkadotSignature>;
}
