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
   * Provide a token used to create/manage the trustchain at the root level, authenticated with the hardware wallet.
   */
  seedIdAuthenticate(transport: Transport): Promise<JWT>;

  /**
   * get a token that we can then use for Live credentials. (used for wallet sync)
   */
  liveAuthenticate(trustchain: Trustchain, liveInstanceCredentials: LiveCredentials): Promise<JWT>;

  /**
   * used by the trustchain setup flow
   * - create trustchain if not exists
   * - add yourself as member
   * - yield the trustchain
   */
  getOrCreateTrustchain(
    transport: Transport,
    seedIdToken: JWT,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<Trustchain>;

  /**
   * when the trustchain is not valid anymore, we will need to restore it (encryption key is no longer passing, typically during the live authenticate / wallet sync phases)
   */
  restoreTrustchain(
    liveJWT: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<Trustchain>;

  /**
   * list the current members for a given trustchain.
   */
  getMembers(
    liveJWT: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<TrustchainMember[]>;

  /**
   * used by the managing synchronized instances flow
   */
  removeMember(
    transport: Transport,
    seedIdToken: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
    member: TrustchainMember,
  ): Promise<Trustchain>;

  /**
   * add a member to the trustchain
   */
  addMember(
    liveJWT: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
    member: TrustchainMember,
  ): Promise<Trustchain>;

  /**
   * completely remove a trustchain
   */
  destroyTrustchain(trustchain: Trustchain, liveJWT: JWT): Promise<void>;

  /**
   * encrypt data for a trustchain
   */
  encryptUserData(trustchain: Trustchain, obj: object): Promise<Uint8Array>;

  /**
   * decrypt data for a trustchain
   */
  decryptUserData(trustchain: Trustchain, data: Uint8Array): Promise<object>;
}
