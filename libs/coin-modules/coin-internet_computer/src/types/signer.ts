export type ICPSignature = {
  returnCode: number;
  errorMessage?: string;
  preSignHash?: Buffer;
  signatureRS?: Buffer;
  signatureDER?: Buffer;
};

export type ICPSignUpdateCall = {
  returnCode: number;
  errorMessage?: string;
  RequestHash?: Buffer;
  RequestSignatureRS?: Buffer;
  StatusReadHash?: Buffer;
  StatusReadSignatureRS?: Buffer;
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
  sign(path: string, message: Buffer, txtype: 1 | 0): Promise<ICPSignature>;
  signUpdateCall(
    path: string,
    message: Buffer,
    readStateBody: Buffer,
    stake: 1 | 0,
  ): Promise<ICPSignUpdateCall>;
}
