export type MemberCredentials = {
  trustchainId: string;
  pubkey: string;
  privatekey: string;
};

export type KeyPair = {
  publicKey: Buffer;
  sign(message: Buffer): Buffer;
};
