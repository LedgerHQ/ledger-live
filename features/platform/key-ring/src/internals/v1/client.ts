import type { KeyRingMemberKeyRecord, KeyRingTreeRecord } from "@domain/entity-key-ring";
import { Permissions } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import {
  NoTrustchainInitialized,
  TrustchainNotFound,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import {
  createQRCodeCandidateInstance,
  createQRCodeHostInstance,
} from "@ledgerhq/ledger-key-ring-protocol/qrcode/index";
import {
  TrustchainResultType,
  type GetOrCreateTrustchainCallbacks,
  type TrustchainMember,
  type TrustchainSDK,
  type WithDevice,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { defer } from "rxjs";
import { KeyRingMemberSchema } from "../../schema";
import type {
  KeyRingActivateOptions,
  KeyRingActivationOutcome,
  KeyRingClient,
  KeyRingDeviceSession,
  KeyRingHostPairingOptions,
  KeyRingJoinPairingOptions,
  KeyRingLifecycle,
  KeyRingMember,
  KeyRingRemoveMemberOptions,
  KeyRingSession,
} from "../../types";
import { memberKeyUpdateOf, stateOf, treeUpdateOf } from "../handles";
import type { LifecycleHub } from "../lifecycleHub";
import { LEDGER_SYNC_APPLICATION_ID } from "./constants";
import type { V1DeviceBridge } from "./deviceBridge";
import { v1Lifecycle } from "./lifecycle";
import { createSliceKeyStore } from "./sliceKeyStore";
import { v1Stream } from "./stream";
import { withKeyRingErrors } from "./withKeyRingErrors";

/** The v1 adapter of `KeyRingClient`: the app client, on the bridge's device access. */
export function createV1Client(setup: V1ClientSetup): KeyRingClient {
  return new V1KeyRingClient(setup, null);
}

/** The v1 SDK builder of an app session: one SDK per device access, on the shared lifecycle. */
export function v1SdkFactory({
  mock,
  instanceName,
  apiBaseUrl,
  hub,
}: Readonly<{ mock: boolean; instanceName: string; apiBaseUrl: string; hub: LifecycleHub }>) {
  return function createSdk(deviceAccess: WithDevice): TrustchainSDK {
    return getSdk(
      mock,
      { applicationId: LEDGER_SYNC_APPLICATION_ID, name: instanceName, apiBaseUrl },
      deviceAccess,
      v1Lifecycle(hub),
    );
  };
}

/** What every v1 client of one app session shares. */
export type V1ClientSetup = Readonly<{
  apiBaseUrl: string;
  bridge: V1DeviceBridge;
  hub: LifecycleHub;
  createSdk: (deviceAccess: WithDevice) => TrustchainSDK;
}>;

class V1KeyRingClient implements KeyRingClient {
  readonly lifecycle: KeyRingLifecycle;
  readonly #setup: V1ClientSetup;
  readonly #deviceSession: KeyRingDeviceSession | null;
  readonly #sdk: TrustchainSDK;
  // The v1 SDK needs a member's permissions back when it removes it: kept out of the public type.
  readonly #listedMembers = new WeakMap<KeyRingMember, TrustchainMember>();

  constructor(setup: V1ClientSetup, deviceSession: KeyRingDeviceSession | null) {
    this.#setup = setup;
    this.#deviceSession = deviceSession;
    this.lifecycle = { onKeyRotation: setup.hub.onKeyRotation, subscribe: setup.hub.subscribe };
    this.#sdk = setup.createSdk(
      deviceSession ? sessionDeviceAccess(setup.bridge, deviceSession) : setup.bridge.withDevice,
    );
  }

  forDeviceSession(deviceSession: KeyRingDeviceSession): KeyRingClient {
    return new V1KeyRingClient(this.#setup, deviceSession);
  }

  createMemberKey() {
    return withKeyRingErrors(async () =>
      memberKeyUpdateOf(await this.#sdk.initMemberCredentials()),
    );
  }

  activate(
    session: KeyRingSession,
    { legacyDeviceId, callbacks, allowTreeCreation = true }: KeyRingActivateOptions,
  ) {
    return withKeyRingErrors(async () => {
      const memberKey = requireMemberKey(session);
      const tree = stateOf(session).trustchain;
      const result = await this.#sdk.getOrCreateTrustchain(
        this.#deviceId(legacyDeviceId),
        memberKey,
        allowTreeCreation
          ? callbacks
          : { ...callbacks, onInitialResponse: rejectSeedWithoutTree() },
        undefined,
        tree ?? undefined,
      );
      return { outcome: OUTCOMES[result.type], tree: treeUpdateOf(result.trustchain) };
    });
  }

  restore(session: KeyRingSession) {
    return withKeyRingErrors(async () =>
      treeUpdateOf(
        await this.#sdk.restoreTrustchain(requireTree(session), requireMemberKey(session)),
      ),
    );
  }

  listMembers(session: KeyRingSession) {
    return withKeyRingErrors(async () => {
      const memberKey = requireMemberKey(session);
      const tree = stateOf(session).trustchain;
      if (!tree) throw new TrustchainNotFound();
      const listed = await this.#sdk.getMembers(tree, memberKey);
      return listed.map(member => {
        const publicMember = KeyRingMemberSchema.parse(member);
        this.#listedMembers.set(publicMember, member);
        return publicMember;
      });
    });
  }

  removeMember(
    session: KeyRingSession,
    { legacyDeviceId, member, callbacks }: KeyRingRemoveMemberOptions,
  ) {
    return withKeyRingErrors(async () => {
      const tree = await this.#sdk.removeMember(
        this.#deviceId(legacyDeviceId),
        requireTree(session),
        requireMemberKey(session),
        this.#listedMembers.get(member) ?? { ...member, permissions: Permissions.OWNER },
        callbacks,
      );
      this.#setup.hub.emit({ type: "member-removed", memberId: member.id });
      return treeUpdateOf(tree);
    });
  }

  destroy(session: KeyRingSession) {
    return withKeyRingErrors(async () => {
      const { trustchainDestroyed } = await this.#sdk.destroyApplication(
        requireTree(session),
        requireMemberKey(session),
      );
      this.#setup.hub.emit({ type: "reset" });
      return { treeDestroyed: trustchainDestroyed };
    });
  }

  hostPairing(
    session: KeyRingSession,
    { memberName, onDisplayQRCode, onDisplayDigits }: KeyRingHostPairingOptions,
  ) {
    return withKeyRingErrors(async () => {
      const memberKey = requireMemberKey(session);
      const tree = stateOf(session).trustchain;
      const joined = await createQRCodeHostInstance({
        trustchainApiBaseUrl: this.#setup.apiBaseUrl,
        onDisplayQRCode,
        onDisplayDigits,
        addMember: addPairedMember(this.#sdk, tree, memberKey),
        memberCredentials: memberKey,
        memberName,
        initialTrustchainId: tree?.rootId,
      });
      return joined ? treeUpdateOf(joined) : null;
    });
  }

  joinPairing(
    session: KeyRingSession,
    { memberName, scannedUrl, onRequestPairingCode }: KeyRingJoinPairingOptions,
  ) {
    return withKeyRingErrors(async () => {
      const memberKey = requireMemberKey(session);
      const tree = stateOf(session).trustchain;
      const joined = await createQRCodeCandidateInstance({
        memberCredentials: memberKey,
        scannedUrl,
        memberName,
        onRequestQRCodeInput: onRequestPairingCode,
        addMember: addPairedMember(this.#sdk, tree, memberKey),
        initialTrustchainId: tree?.rootId,
      });
      return joined ? treeUpdateOf(joined) : null;
    });
  }

  openStream(session: KeyRingSession) {
    const tree = stateOf(session).trustchain;
    const memberKey = memberKeyOf(session);
    return tree && memberKey ? v1Stream(this.#sdk, tree, memberKey) : null;
  }

  invalidateAuth() {
    this.#sdk.invalidateJwt();
  }

  // A DIE session client runs on its session whatever the id; the app client needs the legacy id.
  #deviceId(legacyDeviceId: string | undefined): string {
    if (this.#deviceSession) return this.#deviceSession.sessionId;
    if (legacyDeviceId === undefined) {
      throw new Error("legacyDeviceId is required outside a DIE device session");
    }
    return legacyDeviceId;
  }
}

const OUTCOMES: Readonly<Record<TrustchainResultType, KeyRingActivationOutcome>> = {
  [TrustchainResultType.created]: "created",
  [TrustchainResultType.updated]: "joined",
  [TrustchainResultType.restored]: "restored",
};

// Each device job of the session runs on a transport the bridge makes when the job is subscribed.
function sessionDeviceAccess(
  bridge: V1DeviceBridge,
  deviceSession: KeyRingDeviceSession,
): WithDevice {
  return () => job => defer(() => job(bridge.createSessionTransport(deviceSession)));
}

function memberKeyOf(session: KeyRingSession): KeyRingMemberKeyRecord | null {
  return createSliceKeyStore(() => stateOf(session)).memberCredentials();
}

function requireMemberKey(session: KeyRingSession): KeyRingMemberKeyRecord {
  const memberKey = memberKeyOf(session);
  if (!memberKey) throw new Error("memberCredentials is not set");
  return memberKey;
}

function requireTree(session: KeyRingSession): KeyRingTreeRecord {
  const tree = stateOf(session).trustchain;
  if (!tree) throw new Error("trustchain is not set");
  return tree;
}

// The pairing flows add the other instance to the key tree this instance already belongs to.
function addPairedMember(
  sdk: TrustchainSDK,
  tree: KeyRingTreeRecord | null,
  memberKey: KeyRingMemberKeyRecord,
) {
  return async (member: TrustchainMember) => {
    if (tree) {
      await sdk.addMember(tree, memberKey, member);
      return tree;
    }
    throw new NoTrustchainInitialized();
  };
}

function rejectSeedWithoutTree(): GetOrCreateTrustchainCallbacks["onInitialResponse"] {
  return trees => {
    if (Object.keys(trees).length > 0) return;
    throw new NoTrustchainInitialized();
  };
}
