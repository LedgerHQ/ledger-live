export type KaspaAddress = {
    address: string,
    publicKey: string,
    returnCode: number,
  };
  export type KaspaSignature = {
    signature: Buffer | null,
    returnCode: number
  };
  export interface KaspaSigner {
    getAddress(path: string, display?: boolean): Promise<KaspaAddress>;
    signTransaction(path: string, message: string): Promise<KaspaSignature>;
  }