import { JWT, LiveCredentials, Trustchain, TrustchainMember, TrustchainSDK } from "./types";
import Transport from "@ledgerhq/hw-transport";

const mockedTrustchain: Trustchain = {
  rootId: "mock-root-id",
  walletSyncEncryptionKey: "mock-wallet-sync-encryption-key",
};

class MockSDK implements TrustchainSDK {
  initLiveCredentials(): Promise<LiveCredentials> {
    return Promise.resolve({
      privatekey: "mock-private-key",
      pubkey: "mock-pub-key",
    });
  }

  async seedIdAuthenticate(transport: Transport): Promise<JWT> {
    void transport;
    return Promise.resolve({ accessToken: "mock-seed-id-token" });
  }

  async liveAuthenticate(
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<JWT> {
    void trustchain;
    void liveInstanceCredentials;
    return Promise.resolve({ accessToken: "mock-live-jwt" });
  }

  async getOrCreateTrustchain(
    transport: Transport,
    seedIdToken: JWT,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<Trustchain> {
    void transport;
    void seedIdToken;
    void liveInstanceCredentials;
    return Promise.resolve(mockedTrustchain);
  }

  async restoreTrustchain(
    liveJWT: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<Trustchain> {
    void liveJWT;
    void trustchain;
    void liveInstanceCredentials;
    return Promise.resolve(mockedTrustchain);
  }

  async getMembers(
    liveJWT: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<TrustchainMember[]> {
    void liveJWT;
    void trustchain;
    void liveInstanceCredentials;
    return Promise.resolve([
      {
        id: "mock-member-id",
        name: "mock-member-name",
      },
    ]);
  }

  async removeMember(
    transport: Transport,
    seedIdToken: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
    member: TrustchainMember,
  ): Promise<Trustchain> {
    void transport;
    void seedIdToken;
    void trustchain;
    void liveInstanceCredentials;
    void member;
    return Promise.resolve(mockedTrustchain);
  }

  async destroyTrustchain(trustchain: Trustchain, liveJWT: JWT): Promise<void> {
    void trustchain;
    void liveJWT;
    return;
  }

  addMember(
    liveJWT: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
    member: TrustchainMember,
  ): Promise<Trustchain> {
    void liveJWT;
    void trustchain;
    void liveInstanceCredentials;
    void member;
    return Promise.resolve(mockedTrustchain);
  }

  encryptUserData(trustchain: Trustchain, obj: object): Promise<Uint8Array> {
    void trustchain;
    void obj;
    return Promise.resolve(new Uint8Array());
  }
  decryptUserData(trustchain: Trustchain, data: Uint8Array): Promise<object> {
    void trustchain;
    void data;
    return Promise.resolve({});
  }
}

export const mockSdk = new MockSDK();
