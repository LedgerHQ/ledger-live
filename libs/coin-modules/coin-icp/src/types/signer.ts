export type ICPSignature = {
  return_code: number;
  error_message: string;
  signature_der: Uint8Array;
  signature_compact: Uint8Array;
};

export type ICPGetAddrResponse = {
  addrByte: Uint8Array;
  addrString: string;
  publicKey: string;
  principalText: string;
  return_code: number;
  error_message: string;
};

export interface ICPSigner {
  showAddressAndPubKey(path: string): Promise<ICPGetAddrResponse>;
  getAddressAndPubKey(path: string): Promise<ICPGetAddrResponse>;
  // sign(path: string, message: Uint8Array, txtype: number): Promise<ICPSignature>;
  sign(path: string, message: string, txtype: number): Promise<ICPSignature>;
}
