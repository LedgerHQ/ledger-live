import * as HwTrustchain from "@ledgerhq/hw-trustchain";
import Transport from "@ledgerhq/hw-transport";

// FIXME lib will eventually be used instead of this
void HwTrustchain;

export type JWT = string;

export type Trustchain = {
  rootId: string;
  walletSyncEncryptionKey: string;
};

export type LiveCredentials = {
  privatekey: string;
  pubkey: string;
};

export type TrustchainMember = {
  id: string;
  name: string;
};

/**
 *
 */
export interface TrustchainSDK {
  /**
   * initialize the live credentials that represents one Live instance, member of the trustchain
   */
  initLiveCredentials(): LiveCredentials;

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
   * completely remove a trustchain
   */
  destroyTrustchain(trustchain: Trustchain, liveJWT: JWT): Promise<void>;
}
