export type StacksAddress = {
  publicKey: string;
  address: string;
  chainCode?: string;
};

export type StacksSignature = string; // `0x${string}`

export interface StacksSigner {
  // TODO: complete types
  showAddressAndPubKey: any;
  getAddressAndPubKey: any;
    // TODO: might remove those
  getAddress(
    path: string,
    display?: boolean,
    chainCode?: boolean,
    ed25519?: boolean,
  ): Promise<StacksAddress>;
  signTransaction(path: string, rawTxHex: string, ed25519?: boolean): Promise<StacksSignature>;
}
