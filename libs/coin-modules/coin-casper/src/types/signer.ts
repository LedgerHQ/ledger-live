export type CasperSignature = {
  errorMessage: string;
  returnCode: number;
  signatureRS: Buffer;
  signatureRSV: Buffer;
  signature_compact: Uint8Array;
};

export type CasperGetAddrResponse = {
  errorMessage: string;
  returnCode: number;
  publicKey: Buffer;
  Address: any;
};

export interface CasperSigner {
  showAddressAndPubKey(path: string): Promise<CasperGetAddrResponse>;
  getAddressAndPubKey(path: string): Promise<CasperGetAddrResponse>;
  sign(path: string, message: Buffer): Promise<CasperSignature>;
}
