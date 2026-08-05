// Local structural interfaces mirroring @ledgerhq/ledger-key-ring-protocol types.
// Keeping lkrp out of this package's runtime deps avoids pulling in its native
// addon chain (tiny-secp256k1 etc.) into domain build targets.

export type JWT = {
  accessToken: string;
};

export type Trustchain = {
  rootId: string;
  walletSyncEncryptionKey: string;
  applicationPath: string;
};

export type MemberCredentials = {
  pubkey: string;
  privatekey: string;
};

export type AuthCachePolicy = "no-cache" | "refresh" | "cache";

export interface TrustchainSDK {
  withAuth<T>(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    fn: (jwt: JWT) => Promise<T>,
    cachePolicy?: AuthCachePolicy,
  ): Promise<T>;
  encryptUserData(trustchain: Trustchain, data: Uint8Array): Promise<Uint8Array>;
  decryptUserData(trustchain: Trustchain, data: Uint8Array): Promise<Uint8Array>;
}

export class TrustchainOutdated extends Error {
  override name = "TrustchainOutdated";
  constructor() {
    super("Wallet sync data is outdated");
  }
}

export type TrustchainLifecycle = {
  onTrustchainRotation: (
    trustchainSdk: TrustchainSDK,
    oldTrustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ) => Promise<(newTrustchain: Trustchain) => Promise<void>>;
};
