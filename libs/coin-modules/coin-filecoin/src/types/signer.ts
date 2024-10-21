export type FileCoinSignature = {
  return_code: number;
  error_message: string;
  signature_der: Uint8Array;
  signature_compact: Uint8Array;
};

export type FileCoinGetAddrResponse = {
  addrByte: Uint8Array;
  addrString: string;
  compressed_pk: Uint8Array;
  return_code: number;
  error_message: string;
};
export interface FileCoinSigner {
  showAddressAndPubKey(path: string): Promise<FileCoinGetAddrResponse>;
  getAddressAndPubKey(path: string): Promise<FileCoinGetAddrResponse>;
  sign(path: string, message: Uint8Array): Promise<FileCoinSignature>;
}
