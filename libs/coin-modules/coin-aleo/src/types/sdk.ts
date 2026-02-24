export interface AleoEncryptedRegistrationResponse {
  encrypted: string;
}

export interface AleoDecryptedRecordResponse {
  owner: string;
  data: Record<string, string>;
  nonce: string;
  version: number;
}
