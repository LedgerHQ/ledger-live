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

// Signs a governance update call with its companion read-state request
// (neuron management): a signature for each, plus the read-state body the
// caller submits to poll the call's status.
export type ICPUpdateCallSignature = {
  returnCode: number;
  errorMessage?: string;
  requestHash?: Buffer;
  requestSignatureRS?: Buffer;
  readStateHash?: Buffer;
  readStateSignatureRS?: Buffer;
  readStateBody?: Buffer;
};

export interface ICPSigner {
  getAppConfiguration(): Promise<ICPAppConfiguration>;
  showAddressAndPubKey(path: string): Promise<ICPGetAddrResponse>;
  getAddressAndPubKey(path: string): Promise<ICPGetAddrResponse>;
  // `stake` signs a neuron-creation transfer (governance-subaccount) instead of a plain transfer.
  sign(path: string, message: Buffer, stake?: boolean): Promise<ICPSignature>;
  signUpdateCall(
    path: string,
    callRequest: Buffer,
    readStateRequest: Buffer,
  ): Promise<ICPUpdateCallSignature>;
}
