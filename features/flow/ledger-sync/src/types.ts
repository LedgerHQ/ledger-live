import type {
  KeyRingActivation,
  KeyRingClient,
  KeyRingDeviceCallbacks,
  KeyRingErrorCategory,
  KeyRingMember,
  KeyRingSession,
  KeyRingStream,
  KeyRingTreeUpdate,
} from "@features/platform-key-ring";

/** The `flow` property of the Ledger Sync events, or none. Each app resolves it its own way. */
export type LedgerSyncFlowProperties = Readonly<{ flow?: string }>;

/** What `trackLedgerSyncRejectedOnDevice` reports about the device. */
export type LedgerSyncRejectedOnDeviceProperties = Readonly<{
  modelId: string | undefined;
  connectionType: string;
}>;

/** The restore query of `useRestoreKeyRing`: never runs on its own, `refetch` runs it. */
export type LedgerSyncRestore = Readonly<{
  /** Reloads the key tree from the backend and stores it. */
  refetch: () => Promise<unknown>;
}>;

/** What `useInitMemberKey` returns. */
export type LedgerSyncMemberKeyInit = Readonly<{
  hasMemberKey: boolean;
  /** Creates and stores a member key when this instance has none. */
  generateMemberKey: () => Promise<void>;
}>;

/** The members list of the key tree, as `useLedgerSyncMembers` returns it. */
export type LedgerSyncMembers = Readonly<{
  /** Undefined until loaded, and while this instance is not a member. */
  data: KeyRingMember[] | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  isFetchedAfterMount: boolean;
  isPending: boolean;
  refetch: () => Promise<unknown>;
}>;

/** Options of `useLedgerSyncMembers`. */
export type LedgerSyncMembersOptions = Readonly<{
  client: KeyRingClient;
  /** Called after each render while the query is in error, as the apps did. */
  onError: (error: Error) => void;
}>;

/** Options of `useLedgerSyncErrorRecovery`. */
export type LedgerSyncErrorRecoveryOptions = Readonly<{
  client: KeyRingClient;
  /** The app's move back to the activation, run after the reset and before `invalidateAuth`. */
  onReset: () => void;
  /**
   * True: a members query that resolved no members (`LedgerSyncMembersUnresolvedError`) resets
   * Ledger Sync too. Omitted: it is ignored.
   */
  resetOnUnresolvedMembers?: boolean;
  /** Called first with every handled error, for the app's log. */
  logError?: (error: Error) => void;
}>;

/** What `useLedgerSyncErrorRecovery` returns. */
export type LedgerSyncErrorRecovery = Readonly<{
  /** Resets, restores or ignores the key ring after `error`. A new function on each render. */
  handleError: (error: Error) => void;
}>;

/** Options of `useOnKeyRingRefreshNeeded`. */
export type KeyRingRefreshOptions = Readonly<{
  /** A restore failing with one of these categories resets Ledger Sync. */
  resetOnCategories: readonly KeyRingErrorCategory[];
  /**
   * Where the logged key tree id comes from: the store when the handler runs (`call`), or the
   * render that built the handler (`render`), whose identity then changes with the key tree id.
   */
  readTreeIdAt: "call" | "render";
}>;

/** The Cloud Sync side of `useDestroyLedgerSync`: the app's Cloud Sync client fits it. */
export type LedgerSyncCloudSyncPort = Readonly<{
  destroy(stream: KeyRingStream): Promise<void>;
}>;

/** Options of `useDestroyLedgerSync`. */
export type LedgerSyncDestroyOptions = Readonly<{
  client: KeyRingClient;
  cloudSync: LedgerSyncCloudSyncPort;
  /** On success, before the key ring reset. */
  onBeforeReset?: () => void;
  /** On success, after the wallet sync state is cleared. */
  onAfterReset?: () => void;
  /** On failure. */
  onError?: () => void;
}>;

/** The deletion of the Ledger Sync backup, as `useDestroyLedgerSync` returns it. */
export type LedgerSyncDestroy = Readonly<{
  /** Deletes the Cloud Sync data and leaves the key tree. Rejects on failure. */
  destroy: () => Promise<void>;
  isPending: boolean;
  error: Error | null;
}>;

/** Options of `useLedgerSyncServiceStatus`. */
export type LedgerSyncServiceStatusOptions = Readonly<{
  /** The app's key ring client: it reads the status of its key ring backend. */
  client: KeyRingClient;
  cloudSyncApiBaseUrl: string;
  /** False: neither status is fetched. Omitted: both are. */
  enabled?: boolean;
}>;

/** The combined health of the key ring and Cloud Sync backends. */
export type LedgerSyncServiceStatus = Readonly<{
  /** The first failure, or null. */
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
}>;

/** A failure of `useLedgerSyncPairingHost` other than a closed channel. */
export type LedgerSyncPairingHostFailure = Readonly<{
  /** Undefined for an error that is not a key ring error. */
  category: KeyRingErrorCategory | undefined;
  error: Error;
  /** Shows a new QR code. */
  restart: () => void;
}>;

/** Options of `useLedgerSyncPairingHost`. */
export type LedgerSyncPairingHostOptions = Readonly<{
  client: KeyRingClient;
  /** How the joining instance sees this one. */
  memberName: string;
  /**
   * What `start` captures: the whole session, passed to the pairing (`session`), or the member
   * key only, the pairing reading the latest session (`member-key`). `start` changes identity
   * with what it captures.
   */
  startBinding: "session" | "member-key";
  /** Whether `onPaired` runs before or after the members list is invalidated. */
  notifyPaired: "before-members-refresh" | "after-members-refresh";
  /** The other instance scanned the QR code: show these digits. */
  onDisplayDigits: (digits: string) => void;
  /** The pairing succeeded and its key tree is stored. */
  onPaired: () => void;
  /** Last step of a success, after the QR code URL is cleared. */
  onDigitsCleared: () => void;
  /** The `ledgersync_activated` properties, read when this instance joins. */
  getActivatedEventProperties: () => LedgerSyncFlowProperties;
  /** Any failure but a closed channel, which restarts on its own after 30 seconds. */
  onFailure: (failure: LedgerSyncPairingHostFailure) => void;
}>;

/** What `useLedgerSyncPairingHost` returns. */
export type LedgerSyncPairingHost = Readonly<{
  /** The URL to show as a QR code, or null. */
  url: string | null;
  error: Error | null;
  isLoading: boolean;
  /** Starts a pairing when this instance has a member key. */
  start: () => void;
}>;

/** Options of `useLedgerSyncPairingJoin`. */
export type LedgerSyncPairingJoinOptions = Readonly<{
  client: KeyRingClient;
  /** How the hosting instance sees this one. */
  memberName: string;
  /** The `ledgersync_activated` properties, read when this instance joins. */
  getActivatedEventProperties: () => LedgerSyncFlowProperties;
  /** The pairing succeeded, after the digits state is cleared. */
  onJoined: () => void;
  /** Returns true when the app handled the failure; any other failure is thrown again. */
  onFailure: (error: unknown) => boolean;
}>;

/** What `useLedgerSyncPairingJoin` returns. */
export type LedgerSyncPairingJoin = Readonly<{
  /** How many digits the host shows, once the pairing asks for them. */
  digitsCount: number | null;
  input: string | null;
  setInput: (input: string | null) => void;
  /**
   * Joins the key tree of the scanned host. Resolves true on success, undefined on a failure
   * `onFailure` handled.
   */
  start: (scannedUrl: string, session: KeyRingSession) => Promise<true | undefined>;
  /** Sends the typed digits to the pairing. */
  sendDigits: (input: string) => boolean;
}>;

/** Why a legacy activation or removal failed. */
export type LedgerSyncDeviceFailure =
  | "already-member"
  | "member-of-other-tree"
  | "not-allowed"
  | "no-tree-for-seed"
  | "user-refused"
  | "device-unsupported"
  | "other";

/** The end of a legacy activation or removal. */
export type LedgerSyncDeviceOutcome =
  | Readonly<{ type: "done" }>
  | Readonly<{ type: "failed"; reason: LedgerSyncDeviceFailure; error: unknown }>;

/** Options of the function `useLedgerSyncActivation` returns. */
export type LedgerSyncActivationOptions = Readonly<{
  client: KeyRingClient;
  session: KeyRingSession;
  legacyDeviceId?: string;
  callbacks?: KeyRingDeviceCallbacks;
  /** Omitted: the client default. */
  allowTreeCreation?: boolean;
  /** Throws when the activation must not start; the error becomes the outcome. */
  assertReady?: () => void;
  /** After the key tree is stored. A throw becomes the outcome. */
  onActivated: (activation: KeyRingActivation) => void;
}>;

/** Options of the function `useLedgerSyncMemberRemoval` returns. */
export type LedgerSyncMemberRemovalOptions = Readonly<{
  client: KeyRingClient;
  session: KeyRingSession;
  member: KeyRingMember;
  legacyDeviceId?: string;
  callbacks?: KeyRingDeviceCallbacks;
  /** Throws when the removal must not start; the error becomes the outcome. */
  assertReady?: () => void;
  /** After the new key tree is stored. A throw becomes the outcome. */
  onRemoved: () => void;
}>;

/** What `useLedgerSyncResultAcceptance` returns. */
export type LedgerSyncResultAcceptance<R> = Readonly<{
  /** The last accepted result, or null. */
  resultRef: Readonly<{ current: R | null }>;
  /**
   * Stores `tree` unless Ledger Sync was reset since `runSession`, then keeps `result` and calls
   * `onFirstAccepted` for the first accepted result only. Returns whether it was accepted.
   */
  accept: (
    tree: KeyRingTreeUpdate,
    runSession: KeyRingSession,
    result: R,
    onFirstAccepted?: () => void,
  ) => boolean;
}>;
