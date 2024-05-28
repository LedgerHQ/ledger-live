import { getEnv } from "@ledgerhq/live-env";
import { JWT, LiveCredentials, Trustchain, TrustchainMember, TrustchainSDK } from "./types";
import Transport from "@ledgerhq/hw-transport";
import { Permissions } from "@ledgerhq/hw-trustchain";

const mockedTrustchain: Trustchain = {
  rootId: "mock-root-id",
  walletSyncEncryptionKey: "mock-wallet-sync-encryption-key",
};

const mockedLiveCredentialsPrivateKey = "mock-private-key";

function assertTrustchain(trustchain: Trustchain) {
  if (trustchain.rootId !== mockedTrustchain.rootId) {
    throw new Error("in mock context, trustchain must be the mocked trustchain");
  }
}
function assertLiveCredentials(liveInstanceCredentials: LiveCredentials) {
  if (liveInstanceCredentials.privatekey !== mockedLiveCredentialsPrivateKey) {
    throw new Error(
      "in mock context, liveInstanceCredentials must be the mocked liveInstanceCredentials",
    );
  }
}
const mockedSeedIdAccessToken = { accessToken: "mock-seed-id-token" };
function assertSeedIdToken(seedIdToken: JWT) {
  if (seedIdToken.accessToken !== mockedSeedIdAccessToken.accessToken) {
    throw new Error("in mock context, seedIdToken must be the mocked seedIdToken");
  }
}
const mockedLiveJWT = { accessToken: "mock-live-jwt" };
function assertLiveJWT(liveJWT: JWT) {
  if (liveJWT.accessToken !== mockedLiveJWT.accessToken) {
    throw new Error("in mock context, liveJWT must be the mocked liveJWT");
  }
}

class MockSDK implements TrustchainSDK {
  initLiveCredentials(): Promise<LiveCredentials> {
    return Promise.resolve({
      privatekey: "mock-private-key",
      pubkey: "mock-pub-key-" + getEnv("MOCK"),
    });
  }

  async seedIdAuthenticate(transport: Transport): Promise<JWT> {
    void transport;
    return Promise.resolve(mockedSeedIdAccessToken);
  }

  async liveAuthenticate(
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<JWT> {
    assertTrustchain(trustchain);
    assertLiveCredentials(liveInstanceCredentials);
    return Promise.resolve(mockedLiveJWT);
  }

  async getOrCreateTrustchain(
    transport: Transport,
    seedIdToken: JWT,
    liveInstanceCredentials: LiveCredentials,
    _topic?: Uint8Array,
  ): Promise<{
    jwt: JWT;
    trustchain: Trustchain;
  }> {
    void transport;
    assertSeedIdToken(seedIdToken);
    assertLiveCredentials(liveInstanceCredentials);
    if (this._members.length === 0) {
      this._members.push({
        id: liveInstanceCredentials.pubkey,
        name: "Mock-" + getEnv("MOCK"),
        permissions: Permissions.OWNER,
      });
    }
    return Promise.resolve({
      jwt: seedIdToken,
      trustchain: mockedTrustchain,
    });
  }

  async restoreTrustchain(
    liveJWT: JWT,
    trustchainId: string,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<Trustchain> {
    assertLiveJWT(liveJWT);
    if (typeof trustchainId !== "string") {
      throw new Error("trustchainId must be a string");
    }
    assertLiveCredentials(liveInstanceCredentials);
    return Promise.resolve(mockedTrustchain);
  }

  private _members: TrustchainMember[] = [];

  async getMembers(liveJWT: JWT, trustchain: Trustchain): Promise<TrustchainMember[]> {
    assertLiveJWT(liveJWT);
    assertTrustchain(trustchain);
    return Promise.resolve([...this._members]);
  }

  async removeMember(
    transport: Transport,
    seedIdToken: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
    member: TrustchainMember,
  ): Promise<{
    jwt: JWT;
    trustchain: Trustchain;
  }> {
    void transport;
    assertSeedIdToken(seedIdToken);
    assertTrustchain(trustchain);
    assertLiveCredentials(liveInstanceCredentials);
    this._members = this._members.filter(m => m.id !== member.id);
    return Promise.resolve({
      jwt: mockedSeedIdAccessToken,
      trustchain: mockedTrustchain,
    });
  }

  async destroyTrustchain(trustchain: Trustchain, liveJWT: JWT): Promise<void> {
    assertTrustchain(trustchain);
    assertLiveJWT(liveJWT);
    this._members = [];
    return;
  }

  addMember(
    liveJWT: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
    member: TrustchainMember,
  ): Promise<void> {
    assertLiveJWT(liveJWT);
    assertTrustchain(trustchain);
    assertLiveCredentials(liveInstanceCredentials);
    if (this._members.find(m => m.id === member.id)) {
      throw new Error(
        "member already exists. Please set a different MOCK env value for different live instances.",
      );
    }
    this._members.push(member);
    return Promise.resolve();
  }

  encryptUserData(trustchain: Trustchain, obj: object): Promise<Uint8Array> {
    assertTrustchain(trustchain);
    return Promise.resolve(new TextEncoder().encode(JSON.stringify(obj)));
  }

  decryptUserData(trustchain: Trustchain, data: Uint8Array): Promise<object> {
    assertTrustchain(trustchain);
    return Promise.resolve(JSON.parse(new TextDecoder().decode(data)));
  }
}

export const mockSdk = new MockSDK();
