export type KaspaAddress = {
    address: string,
    publicKey: string
  };
  export type KaspaSignature = {
    signature: string
  };
  export interface KaspaSigner {
    getAddress(path: string, display?: boolean): Promise<KaspaAddress>;
    signTransaction(path: string, message: string): Promise<KaspaSignature>;
  }