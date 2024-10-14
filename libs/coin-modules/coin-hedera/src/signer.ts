export type HederaAddress = {
    publicKey: string;
  };
  export type HederaSignature = Uint8Array | undefined;
  export interface HederaSigner {
    getAddress(path: string, verify?: boolean): Promise<HederaAddress>;
    signTransaction(transaction: Uint8Array): Promise<HederaSignature>;
  }