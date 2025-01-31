export type SuiAddress = {
  pubKey: string;
  address: string;
  return_code: number;
};
export type SuiSignature = {
  signature: null | string;
  return_code: number;
};
export interface SuiSigner {
  getAddress(
    path: string,
    display?: boolean,
  ): Promise<{
    publicKey: string;
    address: string;
    returnCode: number;
  }>;

  signTransaction(
    path: string,
    message: string,
  ): Promise<{ signature: Buffer | null; returnCode: number }>;

  getAppConfiguration(): Promise<{ version: string }>;
}
