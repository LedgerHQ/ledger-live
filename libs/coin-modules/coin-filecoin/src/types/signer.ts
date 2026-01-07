export type FilecoinSignature = {
  signature_der: Uint8Array;
  signature_compact: Uint8Array;
};

export type FilecoinGetAddrResponse = {
  addrByte: Uint8Array;
  addrString: string;
  compressed_pk: Uint8Array;
};
export interface FilecoinSigner {
  showAddressAndPubKey(path: string): Promise<FilecoinGetAddrResponse>;
  getAddressAndPubKey(path: string): Promise<FilecoinGetAddrResponse>;
  sign(path: string, message: Uint8Array): Promise<FilecoinSignature>;
}
