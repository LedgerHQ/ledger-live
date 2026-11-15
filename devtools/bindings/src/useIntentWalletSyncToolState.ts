import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createIntent, isDeviceDisconnectedError } from "@features/platform-device-intent";
import {
  TrustchainMemberId,
  type AddMemberIntent,
  type AddMemberIntentInput,
  type AddMemberIntentPlatformDefinition,
  type CreateSessionSdk,
  type LedgerSyncJobState,
  type RemoveMemberIntent,
  type RemoveMemberIntentPlatformDefinition,
} from "@features/platform-intent-wallet-sync";
import type { UnknownAction } from "@reduxjs/toolkit";
import type {
  MemberCredentials,
  Trustchain,
  TrustchainMember,
  TrustchainSDK,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import type {
  WalletSyncIntentToolLogRow,
  WalletSyncIntentToolOperation,
  WalletSyncIntentToolProps,
} from "@devtools/intent-wallet-sync";

/** The intent the host mounts its Device Intent Executor with, one executor per run. */
export type IntentWalletSyncRun =
  | { readonly operation: "add-member"; readonly intent: AddMemberIntent }
  | { readonly operation: "remove-member"; readonly intent: RemoveMemberIntent };

/** What the app injects: its platform definitions, its session SDK factory and its key ring store action. */
export interface IntentWalletSyncToolStateParams {
  readonly addMemberIntentDefinition: AddMemberIntentPlatformDefinition;
  readonly removeMemberIntentDefinition: RemoveMemberIntentPlatformDefinition;
  readonly createSessionSdk: CreateSessionSdk;
  /** Lists the members without the device: it authenticates with the member credentials. */
  readonly sdk: Pick<TrustchainSDK, "getMembers">;
  /** The key ring store's `setTrustchain`. Its module loads device crypto, so the app passes it. */
  readonly setTrustchain: (trustchain: Trustchain) => UnknownAction;
}

/** The key ring store's slice, which both apps mount under `trustchain`. */
interface TrustchainState {
  readonly trustchain: {
    readonly trustchain: Trustchain | null;
    readonly memberCredentials: MemberCredentials | null;
  };
}

function selectTrustchain(state: TrustchainState) {
  return state.trustchain.trustchain;
}

function selectMemberCredentials(state: TrustchainState) {
  return state.trustchain.memberCredentials;
}

/** The devtool props, and the run the host mounts its executor with. */
export interface IntentWalletSyncToolState {
  readonly toolProps: WalletSyncIntentToolProps;
  /** Null when no operation runs: the host unmounts its executor. */
  readonly run: IntentWalletSyncRun | null;
  /** The user closed the executor: the run ends without a result. */
  readonly onRunCancelled: () => void;
}

/** Never keys nor credentials: the reason, the device model, the error name or the root id. */
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

/** Members belong to the trustchain and credentials they were loaded with. */
interface LoadedMembers {
  readonly rootId: string;
  readonly pubkey: string;
  readonly members: readonly TrustchainMember[];
}

function isLoadedFor(
  loaded: LoadedMembers | null,
  trustchain: Trustchain | null,
  memberCredentials: MemberCredentials | null,
): loaded is LoadedMembers {
  return (
    loaded !== null &&
    loaded.rootId === trustchain?.rootId &&
    loaded.pubkey === memberCredentials?.pubkey
  );
}

function errorName(error: unknown): string | null {
  const name = (error as { name?: unknown } | null)?.name;
  return typeof name === "string" ? name : null;
}

/**
 * Drives the Ledger Sync intents devtool. The host mounts its own executor
 * with `run.intent`; this hook builds the intents, logs every job state they
 * emit, stores their resulting trustchain and reloads members.
 */
export function useIntentWalletSyncToolState(
  params: IntentWalletSyncToolStateParams,
): IntentWalletSyncToolState {
  const dispatch = useDispatch();
  const storedTrustchain = useSelector(selectTrustchain);
  const storedMemberCredentials = useSelector(selectMemberCredentials);

  const latest = {
    ...params,
    trustchain: storedTrustchain,
    memberCredentials: storedMemberCredentials,
  };
  const paramsRef = useRef(latest);
  useLayoutEffect(() => {
    paramsRef.current = latest;
  });

  const onTrustchainChange = useCallback(
    (next: Trustchain) => dispatch(paramsRef.current.setTrustchain(next)),
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
  const loadMembers = useCallback(async (trustchain: Trustchain) => {
    const { memberCredentials, sdk } = paramsRef.current;
    if (!memberCredentials) return;
    const request = ++membersRequestRef.current;
    const isLatestRequest = () => request === membersRequestRef.current;
    try {
      const members = await sdk.getMembers(trustchain, memberCredentials);
      if (isLatestRequest()) {
        setLoadedMembers({ rootId: trustchain.rootId, pubkey: memberCredentials.pubkey, members });
      }
    } catch (error) {
      console.warn("Ledger Sync intents devtool: getMembers failed", errorName(error));
      if (isLatestRequest()) setLoadedMembers(null);
    }
  }, []);

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
    const { memberCredentials, trustchain, createSessionSdk, addMemberIntentDefinition } =
      paramsRef.current;
    if (!memberCredentials) return;

    let completedDetail: string | null = null;
    let resultTrustchain: Trustchain | null = null;
    const input: AddMemberIntentInput = {
      memberCredentials,
      createSessionSdk,
      ...(trustchain ? { currentTrustchain: trustchain } : {}),
    };
    const intent: AddMemberIntent = createIntent(addMemberIntentDefinition, input, {
      onResult: result => {
        resultTrustchain = result.trustchain;
        completedDetail = `${result.type} ${result.trustchain.rootId}`;
        onTrustchainChange(result.trustchain);
      },
      onJobStateChanged: state =>
        append("add-member", state.type, describeJobState(state, completedDetail)),
      onJobComplete: () => {
        setRun(null);
        if (resultTrustchain) void loadMembers(resultTrustchain);
      },
      onJobError: endRunWithError("add-member"),
    });
    setRun({ operation: "add-member", intent });
  }, [append, endRunWithError, loadMembers, onTrustchainChange]);

  const onRemoveMember = useCallback(
    (memberId: TrustchainMemberId) => {
      const { memberCredentials, trustchain, createSessionSdk, removeMemberIntentDefinition } =
        paramsRef.current;
      if (!memberCredentials || !trustchain) return;
      if (!isLoadedFor(loadedMembers, trustchain, memberCredentials)) return;
      const member = loadedMembers.members.find(candidate => candidate.id === memberId);
      // The SDK refuses to remove the current member: that needs its own flow.
      if (!member || member.id === memberCredentials.pubkey) return;

      let resultTrustchain: Trustchain | null = null;
      const intent: RemoveMemberIntent = createIntent(
        removeMemberIntentDefinition,
        { trustchain, memberCredentials, member, createSessionSdk },
        {
          onResult: result => {
            resultTrustchain = result;
            onTrustchainChange(result);
          },
          onJobStateChanged: state =>
            append(
              "remove-member",
              state.type,
              describeJobState(state, resultTrustchain?.rootId ?? null),
            ),
          onJobComplete: () => {
            setRun(null);
            if (resultTrustchain) void loadMembers(resultTrustchain);
          },
          onJobError: endRunWithError("remove-member"),
        },
      );
      setRun({ operation: "remove-member", intent });
    },
    [append, endRunWithError, loadMembers, loadedMembers, onTrustchainChange],
  );

  const onRefreshMembers = useCallback(() => {
    const { trustchain } = paramsRef.current;
    if (trustchain) void loadMembers(trustchain);
  }, [loadMembers]);

  const onClearLog = useCallback(() => setLog([]), []);
  const onRunCancelled = useCallback(() => setRun(null), []);

  const toolMembers = useMemo(() => {
    if (!isLoadedFor(loadedMembers, storedTrustchain, storedMemberCredentials)) return null;
    return loadedMembers.members
      .filter(({ id }) => id !== storedMemberCredentials?.pubkey)
      .map(({ id, name }) => ({ id: TrustchainMemberId.parse(id), name }));
  }, [loadedMembers, storedTrustchain, storedMemberCredentials]);

  const toolProps = useMemo<WalletSyncIntentToolProps>(
    () => ({
      status: run ? "running" : "idle",
      hasMemberCredentials: storedMemberCredentials !== null,
      hasTrustchain: storedTrustchain !== null,
      members: toolMembers,
      log,
      onAddMember,
      onRemoveMember,
      onRefreshMembers,
      onClearLog,
    }),
    [
      run,
      storedMemberCredentials,
      storedTrustchain,
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
