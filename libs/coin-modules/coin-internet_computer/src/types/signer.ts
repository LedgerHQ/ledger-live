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

export type ICPAppConfiguration = {
  version: string;
  testMode: boolean;
  locked: boolean;
};

export interface ICPSigner {
  getAppConfiguration(): Promise<ICPAppConfiguration>;
  showAddressAndPubKey(path: string): Promise<ICPGetAddrResponse>;
  getAddressAndPubKey(path: string): Promise<ICPGetAddrResponse>;
  sign(path: string, message: Buffer): Promise<ICPSignature>;
}
