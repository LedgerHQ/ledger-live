import {
  JWT,
  MemberCredentials,
  Trustchain,
  TrustchainDeviceCallbacks,
  TrustchainLifecycle,
  TrustchainMember,
  TrustchainResult,
  TrustchainResultType,
  TrustchainSDK,
  TrustchainSDKContext,
} from "./types";
import { Permissions } from "@ledgerhq/hw-trustchain";
import { TrustchainEjected } from "./errors";
import getApi from "./api";

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

function assertAllowedPermissions(trustchainId: string, memberId: string) {
  const members = trustchainMembers.get(trustchainId) || [];
  const member = members.find(m => m.id === memberId);
  if (!member) {
    throw new TrustchainEjected();
  }
}

const mockedLiveJWT = {
  accessToken: "mock-live-jwt",
  permissions: {},
};

// global states in memory
const trustchains = new Map<string, Trustchain>();
const trustchainMembers = new Map<string, TrustchainMember[]>();

/**
 * to mock the encryption/decryption, we just xor the data with 0xff
 */
const applyXor = (a: Uint8Array) => {
  const b = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    b[i] = a[i] ^ 0xff;
  }
  return b;
};

export class MockSDK implements TrustchainSDK {
  private context: TrustchainSDKContext;
  private lifecyle?: TrustchainLifecycle;
  private api: ReturnType<typeof getApi>;

  constructor(context: TrustchainSDKContext, lifecyle?: TrustchainLifecycle) {
    this.context = context;
    this.lifecyle = lifecyle;
    this.api = getApi(context.apiBaseUrl);
  }

  private deviceJwtAcquired = false;

  private _id = 1;
  initMemberCredentials(): Promise<MemberCredentials> {
    const id = this._id++;
    return Promise.resolve({
      privatekey: "mock-private-key-" + this.context.name + "-" + id,
      pubkey: "mock-pub-key-" + this.context.name + "-" + id,
    });
  }

  withAuth<T>(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    job: (jwt: JWT) => Promise<T>,
  ): Promise<T> {
    assertTrustchain(trustchain);
    assertLiveCredentials(memberCredentials);
    return job(mockedLiveJWT);
  }

  async getOrCreateTrustchain(
    deviceId: string,
    memberCredentials: MemberCredentials,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<TrustchainResult> {
    this.invalidateJwt();
    assertLiveCredentials(memberCredentials);
    let type = trustchains.has("mock-root-id")
      ? TrustchainResultType.restored
      : TrustchainResultType.created;

    const trustchain: Trustchain = trustchains.get("mock-root-id") || {
      rootId: "mock-root-id",
      walletSyncEncryptionKey: "mock-wallet-sync-encryption-key",
      applicationPath: "m/0'/16'/0'",
    };
    trustchains.set(trustchain.rootId, trustchain);

    if (!this.deviceJwtAcquired) {
      callbacks?.onStartRequestUserInteraction?.();
      this.deviceJwtAcquired = true; // simulate device auth interaction
      callbacks?.onEndRequestUserInteraction?.();
    }

    const currentMembers = trustchainMembers.get(trustchain.rootId) || [];
    // add itself if not yet here
    if (!currentMembers.some(m => m.id === memberCredentials.pubkey)) {
      if (type === TrustchainResultType.restored) type = TrustchainResultType.updated;
      callbacks?.onStartRequestUserInteraction?.();
      // simulate device add interaction
      callbacks?.onEndRequestUserInteraction?.();
      currentMembers.push({
        id: memberCredentials.pubkey,
        name: this.context.name,
        permissions: Permissions.OWNER,
      });
      trustchainMembers.set(trustchain.rootId, currentMembers);
    }
    return Promise.resolve({ type, trustchain });
  }

  async refreshAuth(jwt: JWT): Promise<JWT> {
    return jwt;
  }

  async restoreTrustchain(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): Promise<Trustchain> {
    assertTrustchain(trustchain);
    assertLiveCredentials(memberCredentials);
    assertAllowedPermissions(trustchain.rootId, memberCredentials.pubkey);
    const latest = trustchains.get(trustchain.rootId);
    if (!latest) {
      throw new Error("trustchain not found");
    }
    return Promise.resolve(latest);
  }

  async getMembers(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): Promise<TrustchainMember[]> {
    assertTrustchain(trustchain);
    assertLiveCredentials(memberCredentials);
    assertAllowedPermissions(trustchain.rootId, memberCredentials.pubkey);
    const currentMembers = trustchainMembers.get(trustchain.rootId) || [];
    return Promise.resolve([...currentMembers]);
  }

  async removeMember(
    deviceId: string,
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    member: TrustchainMember,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<Trustchain> {
    this.invalidateJwt();
    assertTrustchain(trustchain);
    assertLiveCredentials(memberCredentials);
    assertAllowedPermissions(trustchain.rootId, memberCredentials.pubkey);
    if (member.id === memberCredentials.pubkey) {
      throw new Error("cannot remove self");
    }
    const afterRotation = await this.lifecyle?.onTrustchainRotation(
      this,
      trustchain,
      memberCredentials,
    );

    if (!this.deviceJwtAcquired) {
      callbacks?.onStartRequestUserInteraction?.();
      this.deviceJwtAcquired = true; // simulate device auth interaction
      callbacks?.onEndRequestUserInteraction?.();
    }

    callbacks?.onStartRequestUserInteraction?.();
    // simulate device interaction
    callbacks?.onEndRequestUserInteraction?.();

    callbacks?.onStartRequestUserInteraction?.();
    // simulate device interaction
    callbacks?.onEndRequestUserInteraction?.();

    const currentMembers = (trustchainMembers.get(trustchain.rootId) || []).filter(
      m => m.id !== member.id,
    );
    trustchainMembers.set(trustchain.rootId, currentMembers);
    // we extract the index part to increment it and recreate a path
    const index = 1 + parseInt(trustchain.applicationPath.split("/")[3].split("'")[0]);
    const newTrustchain = {
      rootId: trustchain.rootId,
      walletSyncEncryptionKey: "mock-wallet-sync-encryption-key-" + index,
      applicationPath: "m/0'/16'/" + index + "'",
    };
    trustchains.set(newTrustchain.rootId, newTrustchain);

    if (afterRotation) await afterRotation(newTrustchain);

    return Promise.resolve(newTrustchain);
  }

  async destroyTrustchain(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): Promise<void> {
    assertTrustchain(trustchain);
    assertLiveCredentials(memberCredentials);
    trustchains.delete(trustchain.rootId);
    trustchainMembers.delete(trustchain.rootId);
    return;
  }

  addMember(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    member: TrustchainMember,
  ): Promise<void> {
    assertTrustchain(trustchain);
    assertLiveCredentials(memberCredentials);
    const currentMembers = trustchainMembers.get(trustchain.rootId) || [];
    if (currentMembers.find(m => m.id === member.id)) {
      return Promise.resolve();
    }
    currentMembers.push(member);
    trustchainMembers.set(trustchain.rootId, currentMembers);
    return Promise.resolve();
  }

  encryptUserData(trustchain: Trustchain, input: Uint8Array): Promise<Uint8Array> {
    assertTrustchain(trustchain);
    return Promise.resolve(applyXor(input));
  }

  decryptUserData(trustchain: Trustchain, data: Uint8Array): Promise<Uint8Array> {
    assertTrustchain(trustchain);
    return Promise.resolve(applyXor(data));
  }

  invalidateJwt(): void {
    this.deviceJwtAcquired = false;
  }
}
