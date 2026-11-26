import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { z } from "zod";
import type {
  KeyRingAccessTokenSchema,
  KeyRingActivationOutcomeSchema,
  KeyRingAuthPolicySchema,
  KeyRingDeviceRequirementSchema,
  KeyRingErrorCategorySchema,
  KeyRingLifecycleEventSchema,
  KeyRingMemberIdSchema,
  KeyRingMemberSchema,
  KeyRingServiceStatusSchema,
  KeyRingStreamRefSchema,
} from "./schema";

/** The public key of a member, as the key ring lists it. Compare with `isCurrentKeyRingMember`. */
export type KeyRingMemberId = z.infer<typeof KeyRingMemberIdSchema>;

/** An instance or agent of the key tree, as `KeyRingClient.listMembers` returns it. */
export type KeyRingMember = z.infer<typeof KeyRingMemberSchema>;

/** Whether `KeyRingClient.activate` created the key tree, joined it, or restored this instance. */
export type KeyRingActivationOutcome = z.infer<typeof KeyRingActivationOutcomeSchema>;

/** Where Cloud Sync stores the data of one stream. Holds no key, so it is safe to log or store. */
export type KeyRingStreamRef = z.infer<typeof KeyRingStreamRefSchema>;

/** The bearer token of the key ring backends, handed to the job of `KeyRingStream.withAuth`. */
export type KeyRingAccessToken = z.infer<typeof KeyRingAccessTokenSchema>;

/** How `KeyRingStream.withAuth` gets its token: `cache`, `refresh` or `no-cache`. */
export type KeyRingAuthPolicy = z.infer<typeof KeyRingAuthPolicySchema>;

/** What the device must provide before a key ring device operation, from `getKeyRingDeviceRequirement`. */
export type KeyRingDeviceRequirement = z.infer<typeof KeyRingDeviceRequirementSchema>;

/**
 * How to initialize the device before a key ring device operation, from
 * `getKeyRingDeviceInitialization`. Branch on `kind`: `app` is the input the DIE executor and the
 * legacy device actions (`appRequest` alone) take; `os-feature` is a requirement they cannot
 * express yet, which the app reports as the `device-unsupported` failure.
 */
export type KeyRingDeviceInitialization =
  | Readonly<{ kind: "app"; appRequest: Readonly<{ appName: string }> }>
  | Readonly<{ kind: "os-feature"; feature: string; minimumOsVersion?: string }>;

/**
 * The protocol-agnostic reason of a key ring failure, from `classifyKeyRingError`. Branch on it
 * instead of on error classes or names.
 */
export type KeyRingErrorCategory = z.infer<typeof KeyRingErrorCategorySchema>;

/** What happened to the key tree, as `KeyRingLifecycle.subscribe` reports it. */
export type KeyRingLifecycleEvent = z.infer<typeof KeyRingLifecycleEventSchema>;

/** The name and version of the key ring backend, from `KeyRingClient.serviceStatus`. */
export type KeyRingServiceStatus = z.infer<typeof KeyRingServiceStatusSchema>;

/**
 * Who this instance is in which key tree, read from the store with `selectKeyRingSession`.
 * Opaque: only this package reads what it holds. Pass it to `KeyRingClient` methods as is.
 */
export type KeyRingSession = Readonly<{ kind: "KeyRingSession" }>;

/** A new state of the key tree, stored with `commitKeyRingTree`. Opaque. */
export type KeyRingTreeUpdate = Readonly<{ kind: "KeyRingTreeUpdate" }>;

/** A new member key for this instance, stored with `commitKeyRingMemberKey`. Opaque. */
export type KeyRingMemberKeyUpdate = Readonly<{ kind: "KeyRingMemberKeyUpdate" }>;

/**
 * The key ring state as the app writes it to disk and reads it back, from
 * `selectPersistedKeyRingState` to `importPersistedKeyRingState`. Opaque: the app serializes it
 * as is and never reads its fields; the JSON stays the one Ledger Sync always wrote.
 */
export type KeyRingPersistedState = Readonly<{ kind: "KeyRingPersistedState" }>;

/**
 * How the protocol adapter reaches devices, built once at the composition root and passed to
 * `createKeyRingClient`. Opaque: the v1 adapter builds it with `createKeyRingV1DeviceBridge` from
 * `@features/platform-key-ring/v1`.
 */
export type KeyRingDeviceBridge = Readonly<{ kind: "KeyRingDeviceBridge" }>;

/** One device session of the Device Management Kit, as a DIE run hands it over. */
export type KeyRingDeviceSession = Readonly<{
  dmk: DeviceManagementKit;
  sessionId: string;
}>;

/** An action of the key ring slice, as the key ring thunks dispatch it. */
export type KeyRingAction = Readonly<{ type: string; payload: unknown }>;

/**
 * A key ring state change that needs the key store, such as generating a member key. Dispatch it
 * with the app's dispatch, on a store whose thunk `extraArgument` holds `keyRingRuntimeExtra`; the
 * returned promise settles once the state is stored.
 */
export type KeyRingThunk = (
  dispatch: (action: KeyRingAction) => unknown,
  getState: () => unknown,
  extra: unknown,
) => Promise<void>;

/**
 * Where this instance keeps its member key, and how the key ring state changes with it: what the
 * key ring thunks, the identity provider and the client share. Opaque: build it once per store
 * with `keyRingRuntimeExtra`. The v1 runtime keeps the key in the `trustchain` slice; a secure key
 * storage replaces it without changing its callers.
 */
export type KeyRingRuntime = Readonly<{ kind: "KeyRingRuntime" }>;

/** This package's slice of the thunk `extraArgument`, from `keyRingRuntimeExtra`. */
export type KeyRingRuntimeExtra = Readonly<{ keyRingRuntime: KeyRingRuntime }>;

/** A dispatch that takes both plain actions and key ring thunks, as the apps' store dispatch does. */
export interface KeyRingDispatch {
  (action: Readonly<{ type: string }>): unknown;
  (thunk: KeyRingThunk): unknown;
}

/** What `KeyRingClient.activate` returns. */
export type KeyRingActivation = Readonly<{
  outcome: KeyRingActivationOutcome;
  /** The key tree this instance now belongs to. Store it with `commitKeyRingTree`. */
  tree: KeyRingTreeUpdate;
}>;

/** Device prompts of one operation: the app shows its confirmation screen in between. */
export type KeyRingDeviceCallbacks = Readonly<{
  /** The device starts asking the user to confirm. */
  onStartRequestUserInteraction?: () => void;
  /** The user answered on the device; the operation goes on. */
  onEndRequestUserInteraction?: () => void;
}>;

/**
 * Encryption and authentication on one stream of the key tree, bound to this instance's key.
 * Get one with `KeyRingClient.openStream`, or from a `KeyRingRotationHandler`. It is bound to the
 * key it was opened with: open a new one after a rotation.
 */
export interface KeyRingStream {
  /** Where the stream's data lives on the backend. */
  readonly ref: KeyRingStreamRef;
  /**
   * Runs `job` with an access token for this stream. `policy` defaults to `cache`. Throws
   * `not-allowed` or `outdated` when the token does not grant this stream.
   */
  withAuth<T>(
    job: (token: KeyRingAccessToken) => Promise<T>,
    policy?: KeyRingAuthPolicy,
  ): Promise<T>;
  /** Encrypts `data` with the key of the stream. */
  encrypt(data: Uint8Array): Promise<Uint8Array>;
  /** Decrypts `data` encrypted with the key of the stream. */
  decrypt(data: Uint8Array): Promise<Uint8Array>;
}

/**
 * Runs while the key rotates: gets the stream about to close, returns what to run on the new
 * one once the rotation is done. Cloud Sync uses it to move its data to the new key
 * (`createRotationReencryption` in `@features/platform-wallet-sync`).
 */
export type KeyRingRotationHandler = (
  previous: KeyRingStream,
) => Promise<(next: KeyRingStream) => Promise<void>>;

/**
 * The lifecycle port of a key ring client, shared by every client derived with
 * `forDeviceSession`. Register once at the composition root.
 *
 * @example
 * ```ts
 * const unregister = client.lifecycle.onKeyRotation(
 *   createRotationReencryption({ cloudSyncApiBaseUrl, getCurrentWSState }),
 * );
 * const unsubscribe = client.lifecycle.subscribe(event => {
 *   if (event.type === "reset") resetWalletSync();
 * });
 * ```
 */
export interface KeyRingLifecycle {
  /** Registers a rotation handler. Returns its unregistration. */
  onKeyRotation(handler: KeyRingRotationHandler): () => void;
  /** Listens to what happened to the key tree. Returns the unsubscription. */
  subscribe(listener: (event: KeyRingLifecycleEvent) => void): () => void;
}

/** Options of `KeyRingClient.activate`. */
export type KeyRingActivateOptions = Readonly<{
  /**
   * The device that signs this instance in, for the flows that do not run on a DIE session yet.
   * A client from `forDeviceSession` ignores it.
   */
  legacyDeviceId?: string;
  callbacks?: KeyRingDeviceCallbacks;
  /** False: a seed with no key tree yet ends the run with a `no-tree-for-seed` error. Default true. */
  allowTreeCreation?: boolean;
}>;

/** Options of `KeyRingClient.removeMember`. */
export type KeyRingRemoveMemberOptions = Readonly<{
  /**
   * The device that signs the key rotation, for the flows that do not run on a DIE session yet.
   * A client from `forDeviceSession` ignores it.
   */
  legacyDeviceId?: string;
  /** The instance to remove, as `listMembers` returned it. */
  member: KeyRingMember;
  callbacks?: KeyRingDeviceCallbacks;
}>;

/** Options of `KeyRingClient.hostPairing`. */
export type KeyRingHostPairingOptions = Readonly<{
  /** How the joining instance sees this one. */
  memberName: string;
  /** Shows the URL as a QR code for the other instance to scan. */
  onDisplayQRCode: (url: string) => void;
  /** Shows the digits the other instance must type. */
  onDisplayDigits: (digits: string) => void;
}>;

/** Options of `KeyRingClient.joinPairing`. */
export type KeyRingJoinPairingOptions = Readonly<{
  /** How the hosting instance sees this one. */
  memberName: string;
  /** The URL read from the host's QR code. */
  scannedUrl: string;
  /** Asks the user for the digits the host shows, then calls `submit` with them. */
  onRequestPairingCode: (
    config: Readonly<{ digits: number; connected: boolean }>,
    submit: (digits: string) => void,
  ) => void;
}>;

/**
 * The trust operations Ledger Wallet needs, whatever the protocol behind them. This is the
 * reference of the package: apps and features only ever talk to the key ring through it.
 *
 * Protocol-agnostic: the v1 adapter on `@ledgerhq/ledger-key-ring-protocol` implements it today,
 * and a v2 adapter on the device-sdk LKRP kit will replace it without changing callers.
 *
 * - Build one client per app session at the composition root with `createKeyRingClient`. A DIE
 *   run gets its own with `forDeviceSession`; both share one `lifecycle`.
 * - Read the session with `selectKeyRingSession` and pass it to each operation. The client keeps
 *   no state of its own: every operation reads who this instance is from that session.
 * - `KeyRingSession`, `KeyRingTreeUpdate` and `KeyRingMemberKeyUpdate` are opaque. Store an
 *   update by dispatching `commitKeyRingTree` or `commitKeyRingMemberKey`; nothing is stored until
 *   then.
 * - Failures are `KeyRingError`s: branch with `classifyKeyRingError`. To show one with the
 *   existing translations, pass it through `keyRingErrorForDisplay`.
 * - Device operations (`activate`, `removeMember`) run as DIE intents in the apps: see
 *   `addMemberIntentDefinition` and `removeMemberIntentDefinition`.
 *
 * @example
 * ```ts
 * // Composition root, once per app session.
 * const client = createKeyRingClient({
 *   mock: isMockEnv,
 *   instanceName,
 *   apiBaseUrl: trustchainApiBaseUrl,
 *   deviceBridge: createKeyRingV1DeviceBridge({ withDevice, createSessionTransport }),
 *   runtime,
 * });
 * registerRotationReencryption(client, { cloudSyncApiBaseUrl, getCurrentWSState });
 *
 * // Activate, then store the key tree it returns.
 * const session = selectKeyRingSession(store.getState());
 * try {
 *   const { tree } = await client.forDeviceSession({ dmk, sessionId }).activate(session, {});
 *   store.dispatch(commitKeyRingTree(tree));
 * } catch (error) {
 *   if (classifyKeyRingError(error) === "user-refused") return showRetry();
 *   throw error;
 * }
 *
 * // Read the new session and open the Cloud Sync stream.
 * const stream = client.openStream(selectKeyRingSession(store.getState()));
 * if (stream) {
 *   const encrypted = await stream.encrypt(payload);
 *   await stream.withAuth(({ accessToken }) => upload(stream.ref, encrypted, accessToken));
 * }
 * ```
 */
export interface KeyRingClient {
  /** Key rotation handlers and key tree events, shared with every derived client. */
  readonly lifecycle: KeyRingLifecycle;
  /**
   * The same client with its device operations bound to one DIE device session. Call it once per
   * run: a retry after a refusal reuses the client and its access token.
   */
  forDeviceSession(deviceSession: KeyRingDeviceSession): KeyRingClient;
  /**
   * Generates a member key for this instance in the key store of the runtime, without joining any
   * key tree. Store it with `commitKeyRingMemberKey`.
   */
  createMemberKey(): Promise<KeyRingMemberKeyUpdate>;
  /**
   * Joins the key tree of the device seed: creates it, joins it or restores this instance in it.
   * Needs a member key in the session and a connected device; the device asks for confirmation.
   */
  activate(session: KeyRingSession, options: KeyRingActivateOptions): Promise<KeyRingActivation>;
  /** Reloads the current key of the key tree, after a rotation by another instance. */
  restore(session: KeyRingSession): Promise<KeyRingTreeUpdate>;
  /** The members of the key tree of the session. Throws `tree-not-found` without a key tree. */
  listMembers(session: KeyRingSession): Promise<KeyRingMember[]>;
  /** Removes another instance; the key tree rotates its key and the rotation handlers run. */
  removeMember(
    session: KeyRingSession,
    options: KeyRingRemoveMemberOptions,
  ): Promise<KeyRingTreeUpdate>;
  /**
   * Leaves Ledger Sync for good on this instance, and destroys the key tree if it was the last.
   * Emits a `reset` lifecycle event; the app then resets with `resetKeyRingState`.
   */
  destroy(session: KeyRingSession): Promise<Readonly<{ treeDestroyed: boolean }>>;
  /**
   * Shows a QR code another instance scans to join; adds it once it typed the digits. Resolves
   * null when the pairing ends without a key tree to store.
   */
  hostPairing(
    session: KeyRingSession,
    options: KeyRingHostPairingOptions,
  ): Promise<KeyRingTreeUpdate | null>;
  /**
   * Joins the key tree of the instance that shows the scanned QR code. Resolves null when the
   * pairing ends without a key tree to store.
   */
  joinPairing(
    session: KeyRingSession,
    options: KeyRingJoinPairingOptions,
  ): Promise<KeyRingTreeUpdate | null>;
  /** The Cloud Sync stream of the session, or null when this instance is not a member. */
  openStream(session: KeyRingSession): KeyRingStream | null;
  /** Drops the cached access token: the next authenticated call asks a new one. */
  invalidateAuth(): void;
  /**
   * The name and version of the key ring backend, for the Ledger Sync status screens. Rejects with
   * the transport error as is when the backend cannot be reached, and on an unexpected shape.
   */
  serviceStatus(): Promise<KeyRingServiceStatus>;
}
