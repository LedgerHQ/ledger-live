export type AptosAddress = {
  publicKey: string;
  address: string;
};

export type AptosSignature = {
  signature: null | Buffer;
  // return_code: number;
  // error_message: string;
  // signature_der: Uint8Array;
  signature_compact: Uint8Array;
};

export type AptosGetAddrResponse = {
  addrByte: Uint8Array;
  addrString: string;
  compressed_pk: Uint8Array;
  return_code: number;
  error_message: string;
};

// The AptosSigner functions must have the same signature as the one defined in hw-app-aptos package.
export interface AptosSigner {
  getAddress(path: string, display: boolean): Promise<AptosAddress>;
  signTransaction(path: string, txBuffer: Buffer): Promise<{ signature: Buffer }>;
  sign(path: string, message: string): Promise<AptosSignature>;
}
