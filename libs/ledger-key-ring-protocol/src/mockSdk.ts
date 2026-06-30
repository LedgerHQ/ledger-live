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
import { Permissions } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { TrustchainEjected } from "./errors";
import getApi from "./api";

const mockedLiveCredentialsPrivateKey = "mock-private-key";
const ROOT_ID = "mock-root-id";

function assertTrustchain(trustchain: Trustchain) {
  if (!trustchain.rootId.startsWith(ROOT_ID)) {
    throw new Error("in mock context, trustchain must be the mocked trustchain");
  }
}

function assertLiveCredentials(memberCredentials: MemberCredentials) {
  if (!memberCredentials.privatekey.startsWith(mockedLiveCredentialsPrivateKey)) {
    throw new Error("in mock context, memberCredentials must be the mocked memberCredentials");
  }
}

const mockedLiveJWT = {
  accessToken: "mock-live-jwt",
  permissions: {},
};

/**
 * The mock models the backend as a tree of applications under a single root.
 * Each application has its own derivation index (bumped on key rotation or reopen),
 * its own members and an open/closed state, so a close on one application leaves the
 * others (and the root) untouched.
 */
type MockAppState = {
  index: number;
  closed: boolean;
  members: TrustchainMember[];
};
type MockRoot = {
  apps: Map<number, MockAppState>;
};

// global states in memory
const roots = new Map<string, MockRoot>();

function keyForIndex(index: number): string {
  return index === 0
    ? "mock-wallet-sync-encryption-key"
    : "mock-wallet-sync-encryption-key-" + index;
}

function buildTrustchain(rootId: string, applicationId: number, app: MockAppState): Trustchain {
  return {
    rootId,
    walletSyncEncryptionKey: keyForIndex(app.index),
    applicationPath: `m/0'/${applicationId}'/${app.index}'`,
  };
}

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
    const applicationId = this.context.applicationId;

    let type = roots.has(ROOT_ID) ? TrustchainResultType.restored : TrustchainResultType.created;
    const root = roots.get(ROOT_ID) ?? { apps: new Map<number, MockAppState>() };
    roots.set(ROOT_ID, root);

    let app = root.apps.get(applicationId);
    if (!app) {
      app = { index: 0, closed: false, members: [] };
      root.apps.set(applicationId, app);
    } else if (app.closed) {
      // the application was deactivated (stream closed): reopen it on the next index
      app = { index: app.index + 1, closed: false, members: [] };
      root.apps.set(applicationId, app);
    }

    if (!this.deviceJwtAcquired) {
      callbacks?.onStartRequestUserInteraction?.();
      this.deviceJwtAcquired = true; // simulate device auth interaction
      callbacks?.onEndRequestUserInteraction?.();
    }

    // add itself if not yet here
    if (!app.members.some(m => m.id === memberCredentials.pubkey)) {
      if (type === TrustchainResultType.restored) type = TrustchainResultType.updated;
      callbacks?.onStartRequestUserInteraction?.();
      // simulate device add interaction
      callbacks?.onEndRequestUserInteraction?.();
      app.members.push({
        id: memberCredentials.pubkey,
        name: this.context.name,
        permissions: Permissions.OWNER,
      });
    }
    return { type, trustchain: buildTrustchain(ROOT_ID, applicationId, app) };
  }

  async refreshAuth(jwt: JWT): Promise<JWT> {
    return jwt;
  }

  /**
   * Resolve the current application of an active member, or throw TrustchainEjected when the member
   * is no longer part of the application (removed, application closed, or trustchain gone).
   */
  private getActiveContext(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): { root: MockRoot; app: MockAppState } {
    assertTrustchain(trustchain);
    assertLiveCredentials(memberCredentials);
    const root = roots.get(trustchain.rootId);
    const app = root?.apps.get(this.context.applicationId);
    if (!root || !app || app.closed || !app.members.some(m => m.id === memberCredentials.pubkey)) {
      throw new TrustchainEjected();
    }
    return { root, app };
  }

  async restoreTrustchain(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): Promise<Trustchain> {
    const { app } = this.getActiveContext(trustchain, memberCredentials);
    return buildTrustchain(trustchain.rootId, this.context.applicationId, app);
  }

  async getMembers(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): Promise<TrustchainMember[]> {
    assertTrustchain(trustchain);
    assertLiveCredentials(memberCredentials);
    // a closed application still exposes its members (matching the real SDK); only a removed member is ejected
    const app = roots.get(trustchain.rootId)?.apps.get(this.context.applicationId);
    if (!app?.members.some(m => m.id === memberCredentials.pubkey)) {
      throw new TrustchainEjected();
    }
    return [...app.members];
  }

  async removeMember(
    deviceId: string,
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    member: TrustchainMember,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<Trustchain> {
    this.invalidateJwt();
    const { app } = this.getActiveContext(trustchain, memberCredentials);
    const applicationId = this.context.applicationId;
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

    // rotate the application: bump the index and drop the removed member
    app.members = app.members.filter(m => m.id !== member.id);
    app.index += 1;
    const newTrustchain = buildTrustchain(trustchain.rootId, applicationId, app);

    if (afterRotation) await afterRotation(newTrustchain);

    return newTrustchain;
  }

  async destroyTrustchain(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): Promise<void> {
    assertTrustchain(trustchain);
    assertLiveCredentials(memberCredentials);
    roots.delete(trustchain.rootId);
    return;
  }

  async destroyApplication(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): Promise<{ trustchainDestroyed: boolean }> {
    this.invalidateJwt();
    assertTrustchain(trustchain);
    assertLiveCredentials(memberCredentials);
    const applicationId = this.context.applicationId;
    const root = roots.get(trustchain.rootId);
    const app = root?.apps.get(applicationId);
    if (!root || !app?.members.some(m => m.id === memberCredentials.pubkey)) {
      throw new TrustchainEjected();
    }
    if (app.closed) {
      return { trustchainDestroyed: false }; // already deactivated
    }

    const anotherApplicationIsOpen = [...root.apps.entries()].some(
      ([id, a]) => id !== applicationId && !a.closed,
    );
    if (!anotherApplicationIsOpen) {
      // last open application: destroy the whole trustchain, as before
      roots.delete(trustchain.rootId);
      return { trustchainDestroyed: true };
    }
    app.closed = true;
    return { trustchainDestroyed: false };
  }

  addMember(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    member: TrustchainMember,
  ): Promise<void> {
    assertTrustchain(trustchain);
    assertLiveCredentials(memberCredentials);
    const applicationId = this.context.applicationId;
    const root = roots.get(trustchain.rootId) ?? { apps: new Map<number, MockAppState>() };
    roots.set(trustchain.rootId, root);
    let app = root.apps.get(applicationId);
    if (!app) {
      app = { index: 0, closed: false, members: [] };
      root.apps.set(applicationId, app);
    }
    if (app.members.some(m => m.id === member.id)) {
      return Promise.resolve();
    }
    app.members.push(member);
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
