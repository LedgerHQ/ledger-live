export type ICPSignature = {
  returnCode: number;
  errorMessage?: string;
  preSignHash?: Buffer;
  signatureRS?: Buffer;
  signatureDER?: Buffer;
};

export type ICPGetAddrResponse = {
  returnCode: number;
  errorMessage: string;
  publicKey?: Buffer;
  principal?: Buffer;
  address?: Buffer;
  principalText?: string;
};

export interface ICPSigner {
  showAddressAndPubKey(path: string): Promise<ICPGetAddrResponse>;
  getAddressAndPubKey(path: string): Promise<ICPGetAddrResponse>;
  sign(path: string, message: Buffer, txtype: number): Promise<ICPSignature>;
}
