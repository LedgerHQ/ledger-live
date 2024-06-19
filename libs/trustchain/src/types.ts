import Transport from "@ledgerhq/hw-transport";

/**
 * The JWT is a JSON Web Token that is used to authenticate the user.
 */
export type JWT = {
  accessToken: string;
};

/**
 * A Trustchain contains the identifier and the contextual data we need to manage members and encrypt/decrypt data.
 */
export type Trustchain = {
  /**
   * The immutable id of the trustchain root
   */
  rootId: string;
  /**
   * The secret used to encrypt/decrypt the wallet sync data
   */
  walletSyncEncryptionKey: string;
  /**
   * The derivation path on which the current walletSyncEncryptionKey value is stored
   */
  applicationPath: string;
};

/**
 * The Trustchain member credentials are stored on each client, with the privatekey only known by the current client.
 */
export type MemberCredentials = {
  /**
   * The public key of the member (in hexadecimal)
   */
  pubkey: string;
  /**
   * The private key of the member (in hexadecimal)
   */
  privatekey: string;
};

/**
 * A member of the trustchain
 */
export type TrustchainMember = {
  /**
   * The id of the member. It corresponds to the MemberCredentials.pubkey
   */
  id: string;
  /**
   * The name of the member as displayed in the UI
   */
  name: string;
  /**
   * a technical permissions of the member. it will often just be Permissions.OWNER
   */
  permissions: number;
};

/**
 * The TrustchainSDKContext is a context that is used to initialize the TrustchainSDK.
 */
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
 * sdk.authWithDevice(transport).then(jwt => console.log(jwt));
 */
export interface TrustchainSDK {
  /**
   * Generate the live credentials that represents a Live instance, member of the trustchain.
   * This method is expected to be used the first time Ledger Live is opened (if Live never generated them before) and then persisted over the future user sessions of Ledger Live in order for the member to be able to authenticate and manage the trustchain.
   */
  initMemberCredentials(): Promise<MemberCredentials>;

  /**
   * Auth with a hardware wallet at the trustchain root level.
   * The returned token will typically be used to create/manage the trustchain.
   */
  authWithDevice(transport: Transport): Promise<JWT>;

  /**
   * Auth with Live credentials.
   * A trustchain must have been created and the Live instance must have been added as a member.
   * The returned token will typically be used for regular operations like wallet sync.
   */
  auth(trustchain: Trustchain, memberCredentials: MemberCredentials): Promise<JWT>;

  /**
   * This method will either create the required trustchains (root and application) or restore them.
   * The returned trustchain will be initialized on the root level and also will have the branch derivation corresponding to the contextual applicationId.
   * It will also have the wallet sync encryption key initialized.
   * The latest jwt is also returned because it was potentially updated during the process.
   */
  getOrCreateTrustchain(
    transport: Transport,
    deviceJWT: JWT,
    memberCredentials: MemberCredentials,
    callbacks?: TrustchainDeviceCallbacks,
    topic?: Uint8Array,
  ): Promise<{
    trustchain: Trustchain;
    jwt: JWT;
  }>;

  /**
   * Restore the current trustchain encryption key, typically due to a key rotation.
   */
  restoreTrustchain(
    jwt: JWT,
    trustchainId: string,
    memberCredentials: MemberCredentials,
  ): Promise<Trustchain>;

  /**
   * list the current members of the application trustchain
   */
  getMembers(jwt: JWT, trustchain: Trustchain): Promise<TrustchainMember[]>;

  /**
   * remove a member from the application trustchain
   */
  removeMember(
    transport: Transport,
    deviceJWT: JWT,
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    member: TrustchainMember,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<{
    jwt: JWT;
    trustchain: Trustchain;
  }>;

  /**
   * add a member to the application trustchain
   */
  addMember(
    jwt: JWT,
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    member: TrustchainMember,
  ): Promise<void>;

  /**
   * destroy the trustchain
   */
  destroyTrustchain(trustchain: Trustchain, jwt: JWT): Promise<void>;

  /**
   * encrypt data with the trustchain encryption key
   */
  encryptUserData(trustchain: Trustchain, obj: object): Promise<Uint8Array>;

  /**
   * decrypt data with the trustchain encryption key
   */
  decryptUserData(trustchain: Trustchain, data: Uint8Array): Promise<Uint8Array>;
}

export interface TrustchainDeviceCallbacks {
  onStartRequestUserInteraction: () => void;
  onEndRequestUserInteraction: () => void;
}
