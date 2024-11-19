export type XrpAddress = {
  publicKey: string;
  address: string;
  chainCode?: string;
};

export type XrpSignature = string; // `0x${string}`

export interface XrpSigner {
  getAddress(
    path: string,
    display?: boolean,
    chainCode?: boolean,
    ed25519?: boolean,
  ): Promise<XrpAddress>;
  signTransaction(path: string, rawTxHex: string, ed25519?: boolean): Promise<XrpSignature>;
}
