import Transport from "@ledgerhq/hw-transport";

export type JWT = {
  accessToken: string;
};

export type Trustchain = {
  rootId: string;
  walletSyncEncryptionKey: string;
};

export type LiveCredentials = {
  // in hex
  pubkey: string;
  // in hex
  privatekey: string;
};

export type TrustchainMember = {
  id: string;
  name: string;
  permissions: number;
};

export type TrustchainSDKContext = {
  applicationId: number;
  name: string;
};

/**
 * The main interface for the UI to interact with the trustchain protocol.
 *
 * @example
 *
 * import { sdk } from "@ledgerhq/trustchain";
 *
 * sdk.seedIdAuthenticate(transport).then(jwt => console.log(jwt));
 */
export interface TrustchainSDK {
  /**
   * Generate the live credentials that represents a Live instance, member of the trustchain.
   * This method is expected to be used the first time Ledger Live is opened (if Live never generated them before) and then persisted over the future user sessions of Ledger Live in order for the member to be able to authenticate and manage the trustchain.
   */
  initLiveCredentials(): Promise<LiveCredentials>;

  /**
   * Auth with a hardware wallet at the trustchain root level.
   * The returned token will typically be used to create/manage the trustchain.
   */
  seedIdAuthenticate(transport: Transport): Promise<JWT>;

  /**
   * Auth with Live credentials.
   * A trustchain must have been created and the Live instance must have been added as a member.
   * The returned token will typically be used for regular operations like wallet sync.
   */
  liveAuthenticate(trustchain: Trustchain, liveInstanceCredentials: LiveCredentials): Promise<JWT>;

  /**
   * This method will either create the required trustchains (root and application) or restore them.
   * The returned trustchain will be initialized on the root level and also will have the branch derivation corresponding to the contextual applicationId.
   * It will also have the wallet sync encryption key initialized.
   * The latest jwt is also returned because it was potentially updated during the process.
   */
  getOrCreateTrustchain(
    transport: Transport,
    seedIdToken: JWT,
    liveInstanceCredentials: LiveCredentials,
    topic?: Uint8Array,
  ): Promise<{
    trustchain: Trustchain;
    jwt: JWT;
  }>;

  /**
   * Restore the current trustchain encryption key, typically due to a key rotation.
   */
  restoreTrustchain(
    liveJWT: JWT,
    trustchainId: string,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<Trustchain>;

  /**
   * list the current members of the application trustchain
   */
  getMembers(liveJWT: JWT, trustchain: Trustchain): Promise<TrustchainMember[]>;

  /**
   * remove a member from the application trustchain
   */
  removeMember(
    transport: Transport,
    seedIdToken: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
    member: TrustchainMember,
  ): Promise<{
    jwt: JWT;
    trustchain: Trustchain;
  }>;

  /**
   * add a member to the application trustchain
   */
  addMember(
    liveJWT: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
    member: TrustchainMember,
  ): Promise<void>;

  /**
   * destroy the trustchain
   */
  destroyTrustchain(trustchain: Trustchain, liveJWT: JWT): Promise<void>;

  /**
   * encrypt data with the trustchain encryption key
   */
  encryptUserData(trustchain: Trustchain, obj: object): Promise<Uint8Array>;

  /**
   * decrypt data with the trustchain encryption key
   */
  decryptUserData(trustchain: Trustchain, data: Uint8Array): Promise<object>;
}
