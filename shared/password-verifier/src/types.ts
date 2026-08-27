export type ScryptParams = Readonly<{
  cost: number;
  blockSize: number;
  parallelization: number;
  digestLength: number;
}>;

export type PasswordVerifier = Readonly<{
  version: number;
  scrypt: ScryptParams;
  salt: Uint8Array;
  digest: Uint8Array;
}>;
