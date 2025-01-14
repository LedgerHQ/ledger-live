export type AptosSignature = {
  return_code: number;
  error_message: string;
  signature_der: Uint8Array;
  signature_compact: Uint8Array;
};

export type AptosGetAddrResponse = {
  addrByte: Uint8Array;
  addrString: string;
  compressed_pk: Uint8Array;
  return_code: number;
  error_message: string;
};

export interface AptosSigner {
  showAddressAndPubKey(path: string): Promise<AptosGetAddrResponse>;
  getAddressAndPubKey(path: string): Promise<AptosGetAddrResponse>;
  sign(path: string, message: Uint8Array): Promise<AptosSignature>;
}
