import { getEnv } from "@ledgerhq/live-env";
import { JWT, MemberCredentials, Trustchain, TrustchainMember, TrustchainSDK } from "./types";
import Transport from "@ledgerhq/hw-transport";
import { Permissions } from "@ledgerhq/hw-trustchain";

const mockedTrustchain: Trustchain = {
  rootId: "mock-root-id",
  walletSyncEncryptionKey: "mock-wallet-sync-encryption-key",
  applicationPath: "0'/16'/0'",
};

const mockedMemberCredentialsPrivateKey = "mock-private-key";

function assertTrustchain(trustchain: Trustchain) {
  if (trustchain.rootId !== mockedTrustchain.rootId) {
    throw new Error("in mock context, trustchain must be the mocked trustchain");
  }
}
function assertMemberCredentials(memberCredentials: MemberCredentials) {
  if (memberCredentials.privatekey !== mockedMemberCredentialsPrivateKey) {
    throw new Error("in mock context, memberCredentials must be the mocked memberCredentials");
  }
}
const mockedSeedIdAccessToken = { accessToken: "mock-seed-id-token" };
function assertSeedIdToken(deviceJWT: JWT) {
  if (deviceJWT.accessToken !== mockedSeedIdAccessToken.accessToken) {
    throw new Error("in mock context, deviceJWT must be the mocked deviceJWT");
  }
}
const mockedLiveJWT = { accessToken: "mock-live-jwt" };
function assertLiveJWT(jwt: JWT) {
  if (jwt.accessToken !== mockedLiveJWT.accessToken) {
    throw new Error("in mock context, jwt must be the mocked jwt");
  }
}

class MockSDK implements TrustchainSDK {
  initMemberCredentials(): Promise<MemberCredentials> {
    return Promise.resolve({
      privatekey: "mock-private-key",
      pubkey: "mock-pub-key-" + getEnv("MOCK"),
    });
  }

  async authWithDevice(transport: Transport): Promise<JWT> {
    void transport;
    return Promise.resolve(mockedSeedIdAccessToken);
  }

  async auth(trustchain: Trustchain, memberCredentials: MemberCredentials): Promise<JWT> {
    assertTrustchain(trustchain);
    assertMemberCredentials(memberCredentials);
    return Promise.resolve(mockedLiveJWT);
  }

  async getOrCreateTrustchain(
    transport: Transport,
    deviceJWT: JWT,
    memberCredentials: MemberCredentials,
  ): Promise<{
    jwt: JWT;
    trustchain: Trustchain;
    hasCreatedTrustchain: boolean;
  }> {
    void transport;
    assertSeedIdToken(deviceJWT);
    assertMemberCredentials(memberCredentials);
    if (this._members.length === 0) {
      this._members.push({
        id: memberCredentials.pubkey,
        name: "Mock-" + getEnv("MOCK"),
        permissions: Permissions.OWNER,
      });
    }
    return Promise.resolve({
      jwt: deviceJWT,
      trustchain: mockedTrustchain,
      hasCreatedTrustchain: true,
    });
  }

  async restoreTrustchain(
    jwt: JWT,
    trustchainId: string,
    memberCredentials: MemberCredentials,
  ): Promise<Trustchain> {
    assertLiveJWT(jwt);
    if (typeof trustchainId !== "string") {
      throw new Error("trustchainId must be a string");
    }
    assertMemberCredentials(memberCredentials);
    return Promise.resolve(mockedTrustchain);
  }

  private _members: TrustchainMember[] = [];

  async getMembers(jwt: JWT, trustchain: Trustchain): Promise<TrustchainMember[]> {
    assertLiveJWT(jwt);
    assertTrustchain(trustchain);
    return Promise.resolve([...this._members]);
  }

  async removeMember(
    transport: Transport,
    deviceJWT: JWT,
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    member: TrustchainMember,
  ): Promise<{
    jwt: JWT;
    trustchain: Trustchain;
  }> {
    void transport;
    assertSeedIdToken(deviceJWT);
    assertTrustchain(trustchain);
    assertMemberCredentials(memberCredentials);
    this._members = this._members.filter(m => m.id !== member.id);
    return Promise.resolve({
      jwt: mockedSeedIdAccessToken,
      trustchain: mockedTrustchain,
    });
  }

  async destroyTrustchain(trustchain: Trustchain, jwt: JWT): Promise<void> {
    assertTrustchain(trustchain);
    assertLiveJWT(jwt);
    this._members = [];
    return;
  }

  addMember(
    jwt: JWT,
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    member: TrustchainMember,
  ): Promise<void> {
    assertLiveJWT(jwt);
    assertTrustchain(trustchain);
    assertMemberCredentials(memberCredentials);
    if (this._members.find(m => m.id === member.id)) {
      throw new Error(
        "member already exists. Please set a different MOCK env value for different instances.",
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
