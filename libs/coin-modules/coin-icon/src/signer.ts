export type IconAddress = {
  publicKey: string;
  address: string;
  chainCode?: string;
};
export type IconSignature = {
  signedRawTxBase64: string;
  hashHex: string;
};

export interface IconSigner {
  getAddress(path: string, shouldDisplay?: boolean): Promise<IconAddress>;
  signTransaction(path: string, rawTxAscii: string): Promise<IconSignature>;
}
