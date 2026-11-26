import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { createIntent, isDeviceDisconnectedError } from "@features/platform-device-intent";
import {
  acceptLedgerSyncResult,
  isCurrentKeyRingMember,
  isSameKeyRingMember,
  selectKeyRingSession,
  type AddMemberIntent,
  type AddMemberIntentPlatformDefinition,
  type KeyRingClient,
  type KeyRingMember,
  type KeyRingMemberId,
  type KeyRingSession,
  type KeyRingTreeUpdate,
  type LedgerSyncJobState,
  type LedgerSyncResultOrder,
  type RemoveMemberIntent,
  type RemoveMemberIntentPlatformDefinition,
} from "@features/platform-key-ring";
import {
  selectHasKeyRingMemberKey,
  selectIsKeyRingMember,
  selectKeyRingTreeId,
  type KeyRingState,
} from "@domain/entity-key-ring";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type {
  WalletSyncIntentToolLogRow,
  WalletSyncIntentToolOperation,
  WalletSyncIntentToolProps,
} from "@devtools/intent-wallet-sync";

/** The intent the host mounts its Device Intent Executor with, one executor per run. */
export type IntentWalletSyncRun =
  | { readonly operation: "add-member"; readonly intent: AddMemberIntent }
  | { readonly operation: "remove-member"; readonly intent: RemoveMemberIntent };

/** What the app injects: its platform definitions, its key ring client and its key ring action. */
export interface IntentWalletSyncToolStateParams {
  readonly addMemberIntentDefinition: AddMemberIntentPlatformDefinition;
  readonly removeMemberIntentDefinition: RemoveMemberIntentPlatformDefinition;
  /** The app's one Ledger Sync result order, the one its Ledger Sync screens pass too. */
  readonly resultOrder: LedgerSyncResultOrder;
  /** The app's cached client: it lists the members and runs the intents. */
  readonly keyRing: KeyRingClient;
  /** The key ring's `commitKeyRingTree`. Its module loads device crypto, so the app passes it. */
  readonly commitKeyRingTree: (update: KeyRingTreeUpdate) => UnknownAction;
}

/** The key ring slice, which both apps mount under `trustchain`. */
type KeyRingRootState = Readonly<{ trustchain: KeyRingState }>;

/** The devtool props, and the run the host mounts its executor with. */
export interface IntentWalletSyncToolState {
  readonly toolProps: WalletSyncIntentToolProps;
  /** Null when no operation runs: the host unmounts its executor. */
  readonly run: IntentWalletSyncRun | null;
  /** The user closed the executor: the run ends without a result. */
  readonly onRunCancelled: () => void;
}

/** Never keys nor credentials: the reason, the device model, the error name or the key tree id. */
function describeJobState(state: LedgerSyncJobState, completedDetail: string | null) {
  switch (state.type) {
    case "failed":
      return state.reason;
    case "device-rejected":
      return state.error.name;
    case "awaiting-device-confirmation":
      return state.deviceModelId;
    case "completed":
      return completedDetail;
    case "pending":
    case "processing":
      return null;
  }
}

/** Members belong to the key tree and the member key they were loaded with. */
interface LoadedMembers {
  readonly treeId: string | null;
  readonly session: KeyRingSession;
  readonly members: readonly KeyRingMember[];
}

function isLoadedFor(
  loaded: LoadedMembers | null,
  treeId: string | null,
  session: KeyRingSession,
): loaded is LoadedMembers {
  return (
    loaded !== null && loaded.treeId === treeId && isSameKeyRingMember(loaded.session, session)
  );
}

function errorName(error: unknown): string | null {
  const name = (error as { name?: unknown } | null)?.name;
  return typeof name === "string" ? name : null;
}

/**
 * Drives the Ledger Sync intents devtool. The host mounts its own executor
 * with `run.intent`; this hook builds the intents, logs every job state they
 * emit, commits their resulting key tree and reloads members.
 */
export function useIntentWalletSyncToolState(
  params: IntentWalletSyncToolStateParams,
): IntentWalletSyncToolState {
  const dispatch = useDispatch<ThunkDispatch<KeyRingRootState, unknown, UnknownAction>>();
  const store = useStore<KeyRingRootState>();
  const session = useSelector(selectKeyRingSession);
  const treeId = useSelector(selectKeyRingTreeId);
  const hasMemberKey = useSelector(selectHasKeyRingMemberKey);
  const isMember = useSelector(selectIsKeyRingMember);

  const paramsRef = useRef(params);
  useLayoutEffect(() => {
    paramsRef.current = params;
  });

  // A Ledger Sync reset since the run started rotates the member key: its late result is dropped.
  const commitRunTree = useCallback(
    (update: KeyRingTreeUpdate, runSession: KeyRingSession): boolean =>
      dispatch(acceptLedgerSyncResult(paramsRef.current.commitKeyRingTree(update), runSession)),
    [dispatch],
  );

  const [run, setRun] = useState<IntentWalletSyncRun | null>(null);
  const [log, setLog] = useState<readonly WalletSyncIntentToolLogRow[]>([]);
  const [loadedMembers, setLoadedMembers] = useState<LoadedMembers | null>(null);

  const append = useCallback(
    (operation: WalletSyncIntentToolOperation, jobState: string, detail: string | null) => {
      setLog(rows => [...rows, { at: Date.now(), operation, jobState, detail }]);
    },
    [],
  );

  const membersRequestRef = useRef(0);
  const loadMembers = useCallback(async () => {
    const state = store.getState();
    if (!selectHasKeyRingMemberKey(state) || !selectIsKeyRingMember(state)) return;
    const requestSession = selectKeyRingSession(state);
    const requestTreeId = selectKeyRingTreeId(state);
    const request = ++membersRequestRef.current;
    const isLatestRequest = () => request === membersRequestRef.current;
    try {
      const members = await paramsRef.current.keyRing.listMembers(requestSession);
      if (isLatestRequest()) {
        setLoadedMembers({ treeId: requestTreeId, session: requestSession, members });
      }
    } catch (error) {
      console.warn("Ledger Sync intents devtool: listMembers failed", errorName(error));
      if (isLatestRequest()) setLoadedMembers(null);
    }
  }, [store]);

  const endRunWithError = useCallback(
    (operation: WalletSyncIntentToolOperation) => (error: unknown) => {
      if (isDeviceDisconnectedError(error)) {
        // The executor stays mounted to show its Disconnected screen until the user closes it.
        append(operation, "disconnected", errorName(error));
        return;
      }
      append(operation, "error", errorName(error));
      setRun(null);
    },
    [append],
  );

  const onAddMember = useCallback(() => {
    const state = store.getState();
    if (!selectHasKeyRingMemberKey(state)) return;
    const { keyRing, resultOrder, addMemberIntentDefinition } = paramsRef.current;
    const runSession = selectKeyRingSession(state);

    let completedDetail: string | null = null;
    let resultCommitted = false;
    const intent: AddMemberIntent = createIntent(
      addMemberIntentDefinition,
      { session: runSession, client: keyRing, resultOrder },
      {
        onResult: result => {
          if (!commitRunTree(result.tree, runSession)) return;
          resultCommitted = true;
          completedDetail = `${result.outcome} ${selectKeyRingTreeId(store.getState())}`;
        },
        onJobStateChanged: jobState =>
          append("add-member", jobState.type, describeJobState(jobState, completedDetail)),
        onJobComplete: () => {
          setRun(null);
          if (resultCommitted) void loadMembers();
        },
        onJobError: endRunWithError("add-member"),
      },
    );
    setRun({ operation: "add-member", intent });
  }, [append, commitRunTree, endRunWithError, loadMembers, store]);

  const onRemoveMember = useCallback(
    (memberId: KeyRingMemberId) => {
      const state = store.getState();
      if (!selectHasKeyRingMemberKey(state) || !selectIsKeyRingMember(state)) return;
      const runSession = selectKeyRingSession(state);
      if (!isLoadedFor(loadedMembers, selectKeyRingTreeId(state), runSession)) return;
      const member = loadedMembers.members.find(candidate => candidate.id === memberId);
      // The key ring refuses to remove the current member: that needs its own flow.
      if (!member || isCurrentKeyRingMember(runSession, member.id)) return;
      const { keyRing, resultOrder, removeMemberIntentDefinition } = paramsRef.current;

      let resultTreeId: string | null = null;
      let resultCommitted = false;
      const intent: RemoveMemberIntent = createIntent(
        removeMemberIntentDefinition,
        { session: runSession, member, client: keyRing, resultOrder },
        {
          onResult: update => {
            if (!commitRunTree(update, runSession)) return;
            resultCommitted = true;
            resultTreeId = selectKeyRingTreeId(store.getState());
          },
          onJobStateChanged: jobState =>
            append("remove-member", jobState.type, describeJobState(jobState, resultTreeId)),
          onJobComplete: () => {
            setRun(null);
            if (resultCommitted) void loadMembers();
          },
          onJobError: endRunWithError("remove-member"),
        },
      );
      setRun({ operation: "remove-member", intent });
    },
    [append, commitRunTree, endRunWithError, loadMembers, loadedMembers, store],
  );

  const onRefreshMembers = useCallback(() => {
    void loadMembers();
  }, [loadMembers]);

  const onClearLog = useCallback(() => setLog([]), []);
  const onRunCancelled = useCallback(() => setRun(null), []);

  const toolMembers = useMemo(() => {
    if (!isLoadedFor(loadedMembers, treeId, session)) return null;
    return loadedMembers.members
      .filter(({ id }) => !isCurrentKeyRingMember(session, id))
      .map(({ id, name }) => ({ id, name }));
  }, [loadedMembers, treeId, session]);

  const toolProps = useMemo<WalletSyncIntentToolProps>(
    () => ({
      status: run ? "running" : "idle",
      hasMemberCredentials: hasMemberKey,
      hasTrustchain: isMember,
      members: toolMembers,
      log,
      onAddMember,
      onRemoveMember,
      onRefreshMembers,
      onClearLog,
    }),
    [
      run,
      hasMemberKey,
      isMember,
      toolMembers,
      log,
      onAddMember,
      onRemoveMember,
      onRefreshMembers,
      onClearLog,
    ],
  );

  return { toolProps, run, onRunCancelled };
}
