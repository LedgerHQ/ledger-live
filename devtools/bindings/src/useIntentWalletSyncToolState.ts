import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createIntent } from "@features/platform-device-intent";
import type {
  AddMemberIntent,
  AddMemberIntentInput,
  AddMemberIntentPlatformDefinition,
  CreateSessionSdk,
  LedgerSyncJobState,
  RemoveMemberIntent,
  RemoveMemberIntentPlatformDefinition,
} from "@features/platform-intent-wallet-sync";
import type {
  MemberCredentials,
  Trustchain,
  TrustchainMember,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import type { DevToolsConfig } from "@devtools/registry";

type IntentWalletSyncToolProps = Extract<
  DevToolsConfig[number],
  { id: "intent-wallet-sync" }
>["config"];
type LogRow = IntentWalletSyncToolProps["log"][number];
type Operation = LogRow["operation"];

/** The intent the host mounts its Device Intent Executor with, one executor per run. */
export type IntentWalletSyncRun =
  | { readonly operation: "add-member"; readonly intent: AddMemberIntent }
  | { readonly operation: "remove-member"; readonly intent: RemoveMemberIntent };

export interface IntentWalletSyncToolStateParams {
  readonly addMemberIntentDefinition: AddMemberIntentPlatformDefinition;
  readonly removeMemberIntentDefinition: RemoveMemberIntentPlatformDefinition;
  readonly createSessionSdk: CreateSessionSdk;
  readonly trustchain: Trustchain | null;
  readonly memberCredentials: MemberCredentials | null;
  /** Lists the members without the device: the SDK authenticates with the member credentials. */
  readonly getMembers: (
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ) => Promise<TrustchainMember[]>;
  /** Writes an operation's resulting trustchain to the app's store. */
  readonly onTrustchainChange: (trustchain: Trustchain) => void;
}

export interface IntentWalletSyncToolState {
  readonly toolProps: IntentWalletSyncToolProps;
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
      return null;
  }
}

function errorName(error: unknown): string | null {
  const name = (error as { name?: unknown } | null)?.name;
  return typeof name === "string" ? name : null;
}

/**
 * Drives the Ledger Sync intents devtool. The host mounts its own executor
 * with `run.intent`; this hook builds the intents, logs every job state they
 * emit, writes results back through `onTrustchainChange` and reloads members.
 */
export function useIntentWalletSyncToolState(
  params: IntentWalletSyncToolStateParams,
): IntentWalletSyncToolState {
  const paramsRef = useRef(params);
  useLayoutEffect(() => {
    paramsRef.current = params;
  });

  const [run, setRun] = useState<IntentWalletSyncRun | null>(null);
  const [log, setLog] = useState<readonly LogRow[]>([]);
  const [members, setMembers] = useState<readonly TrustchainMember[] | null>(null);

  const append = useCallback((operation: Operation, jobState: string, detail: string | null) => {
    setLog(rows => [...rows, { at: Date.now(), operation, jobState, detail }]);
  }, []);

  const loadMembers = useCallback(async (trustchain: Trustchain) => {
    const { memberCredentials, getMembers } = paramsRef.current;
    if (!memberCredentials) return;
    try {
      setMembers(await getMembers(trustchain, memberCredentials));
    } catch (error) {
      console.warn("Ledger Sync intents devtool: getMembers failed", errorName(error));
      setMembers(null);
    }
  }, []);

  const endRunWithError = useCallback(
    (operation: Operation) => (error: unknown) => {
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
        paramsRef.current.onTrustchainChange(result.trustchain);
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
  }, [append, endRunWithError, loadMembers]);

  const onRemoveMember = useCallback(
    (memberId: string) => {
      const { memberCredentials, trustchain, createSessionSdk, removeMemberIntentDefinition } =
        paramsRef.current;
      const member = members?.find(candidate => candidate.id === memberId);
      if (!memberCredentials || !trustchain || !member) return;

      let resultTrustchain: Trustchain | null = null;
      const intent: RemoveMemberIntent = createIntent(
        removeMemberIntentDefinition,
        { trustchain, memberCredentials, member, createSessionSdk },
        {
          onResult: result => {
            resultTrustchain = result;
            paramsRef.current.onTrustchainChange(result);
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
    [append, endRunWithError, loadMembers, members],
  );

  const onRefreshMembers = useCallback(() => {
    const { trustchain } = paramsRef.current;
    if (trustchain) void loadMembers(trustchain);
  }, [loadMembers]);

  const onClearLog = useCallback(() => setLog([]), []);
  const onRunCancelled = useCallback(() => setRun(null), []);

  const toolProps = useMemo<IntentWalletSyncToolProps>(
    () => ({
      status: run ? "running" : "idle",
      hasMemberCredentials: params.memberCredentials !== null,
      hasTrustchain: params.trustchain !== null,
      members: members?.map(({ id, name }) => ({ id, name })) ?? null,
      log,
      onAddMember,
      onRemoveMember,
      onRefreshMembers,
      onClearLog,
    }),
    [
      run,
      params.memberCredentials,
      params.trustchain,
      members,
      log,
      onAddMember,
      onRemoveMember,
      onRefreshMembers,
      onClearLog,
    ],
  );

  return { toolProps, run, onRunCancelled };
}
