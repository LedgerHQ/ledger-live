import {
  JWT,
  MemberCredentials,
  Trustchain,
  TrustchainMember,
  TrustchainSDK,
  TrustchainSDKContext,
} from "./types";
import Transport from "@ledgerhq/hw-transport";
import { Permissions } from "@ledgerhq/hw-trustchain";

const mockedLiveCredentialsPrivateKey = "mock-private-key";

function assertTrustchain(trustchain: Trustchain) {
  if (!trustchain.rootId.startsWith("mock-root-id")) {
    throw new Error("in mock context, trustchain must be the mocked trustchain");
  }
}

function assertLiveCredentials(memberCredentials: MemberCredentials) {
  if (!memberCredentials.privatekey.startsWith(mockedLiveCredentialsPrivateKey)) {
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
  if (
    jwt.accessToken !== mockedLiveJWT.accessToken &&
    // device auth is also accepted
    jwt.accessToken !== mockedSeedIdAccessToken.accessToken
  ) {
    throw new Error("in mock context, jwt must be the mocked jwt");
  }
}

// global states in memory
const trustchains = new Map<string, Trustchain>();
const trustchainMembers = new Map<string, TrustchainMember[]>();

export class MockSDK implements TrustchainSDK {
  private context: TrustchainSDKContext;
  constructor(context: TrustchainSDKContext) {
    this.context = context;
  }

  private _id = 1;
  initMemberCredentials(): Promise<MemberCredentials> {
    const id = this._id++;
    return Promise.resolve({
      privatekey: "mock-private-key-" + this.context.name + "-" + id,
      pubkey: "mock-pub-key-" + this.context.name + "-" + id,
    });
  }

  async authWithDevice(transport: Transport): Promise<JWT> {
    void transport;
    return Promise.resolve(mockedSeedIdAccessToken);
  }

  async auth(trustchain: Trustchain, memberCredentials: MemberCredentials): Promise<JWT> {
    assertTrustchain(trustchain);
    assertLiveCredentials(memberCredentials);
    return Promise.resolve(mockedLiveJWT);
  }

  async getOrCreateTrustchain(
    transport: Transport,
    deviceJWT: JWT,
    memberCredentials: MemberCredentials,
  ): Promise<{
    jwt: JWT;
    trustchain: Trustchain;
  }> {
    void transport;
    assertSeedIdToken(deviceJWT);
    assertLiveCredentials(memberCredentials);

    const trustchain: Trustchain = trustchains.get("mock-root-id") || {
      rootId: "mock-root-id",
      walletSyncEncryptionKey: "mock-wallet-sync-encryption-key",
      applicationPath: "0'/16'/0'",
    };
    trustchains.set(trustchain.rootId, trustchain);

    if (trustchains.has(trustchain.rootId)) {
      trustchains.set(trustchain.rootId, trustchain);
    }
    const currentMembers = trustchainMembers.get(trustchain.rootId) || [];
    if (currentMembers.length === 0) {
      currentMembers.push({
        id: memberCredentials.pubkey,
        name: this.context.name,
        permissions: Permissions.OWNER,
      });
      trustchainMembers.set(trustchain.rootId, currentMembers);
    }
    return Promise.resolve({
      jwt: deviceJWT,
      trustchain: trustchain,
    });
  }

  async refreshAuth(jwt: JWT): Promise<JWT> {
    return jwt;
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
    assertLiveCredentials(memberCredentials);
    const trustchain = trustchains.get(trustchainId);
    if (!trustchain) {
      throw new Error("trustchain not found");
    }
    return Promise.resolve(trustchain);
  }

  async getMembers(jwt: JWT, trustchain: Trustchain): Promise<TrustchainMember[]> {
    assertLiveJWT(jwt);
    assertTrustchain(trustchain);
    const currentMembers = trustchainMembers.get(trustchain.rootId) || [];
    return Promise.resolve([...currentMembers]);
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
    assertLiveCredentials(memberCredentials);
    const currentMembers = (trustchainMembers.get(trustchain.rootId) || []).filter(
      m => m.id !== member.id,
    );
    trustchainMembers.set(trustchain.rootId, currentMembers);
    // we extract the index part to increment it and recreate a path
    const index = 1 + parseInt(trustchain.applicationPath.split("/")[2].split("'")[0]);
    const newTrustchain = {
      rootId: trustchain.rootId,
      walletSyncEncryptionKey: "mock-wallet-sync-encryption-key-" + index,
      applicationPath: "0'/16'/" + index + "'",
    };
    trustchains.set(newTrustchain.rootId, newTrustchain);
    return Promise.resolve({
      jwt: mockedSeedIdAccessToken,
      trustchain: newTrustchain,
    });
  }

  async destroyTrustchain(trustchain: Trustchain, jwt: JWT): Promise<void> {
    assertTrustchain(trustchain);
    assertLiveJWT(jwt);
    trustchains.delete(trustchain.rootId);
    trustchainMembers.delete(trustchain.rootId);
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
    assertLiveCredentials(memberCredentials);
    const currentMembers = trustchainMembers.get(trustchain.rootId) || [];
    if (currentMembers.find(m => m.id === member.id)) {
      throw new Error(
        "member already exists. Please set a different context name value for different instances.",
      );
    }
    currentMembers.push(member);
    trustchainMembers.set(trustchain.rootId, currentMembers);
    return Promise.resolve();
  }

  encryptUserData(trustchain: Trustchain, input: Uint8Array): Promise<Uint8Array> {
    assertTrustchain(trustchain);
    return Promise.resolve(input);
  }

  decryptUserData(trustchain: Trustchain, data: Uint8Array): Promise<Uint8Array> {
    assertTrustchain(trustchain);
    return Promise.resolve(data);
  }
}
