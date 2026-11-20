import { useCallback, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type {
  AccountDiscoveryState,
  AccountDiscoveryToolProps,
  CompletionRunStatus,
  DiscoveredRow,
  ScanCounters,
} from "@devtools/account-discovery";
import { getAccountDataRuntime } from "@domain/api-account-data";
import {
  accountDescriptorKey,
  serializeAccountDescriptor,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
import type { CryptoCurrencyId } from "@domain/entity-currency-crypto";
import type { ScanRules } from "@domain/entity-derivation";
import {
  completionStates,
  discoverAccounts,
  dropPending,
  failPending,
  isSettled,
  mergeCompletionStates,
  splitSelection,
  statusThroughRouter,
  type AccountCompletionEvent,
  type CompleteAccounts,
  type CompletionStates,
  type DeriveAccount,
  type DiscoveredAccount,
  type DiscoveryHost,
  type NeedsCompletion,
} from "@features/platform-account-discovery";
import {
  createIntent,
  isDeviceDisconnectedError,
  type DeviceConnectionResult,
  type Intent,
  type IntentPlatformDefinition,
} from "@features/platform-device-intent";
import {
  createScanAccountsIntentDefinition,
  type ScanAccountsIntentInput,
  type ScanAccountsIntentJobState,
  type ScanAccountsIntentResult,
} from "@features/platform-intent-scan-accounts";

export type AccountDiscoveryJobState = ScanAccountsIntentJobState<DiscoveredAccount>;
type Input = ScanAccountsIntentInput<DiscoveredAccount>;
type Result = ScanAccountsIntentResult<DiscoveredAccount>;

export type AccountDiscoveryIntentPlatformDefinition = IntentPlatformDefinition<
  AccountDiscoveryJobState,
  Input,
  undefined,
  Result
>;
export type AccountDiscoveryIntent = Intent<AccountDiscoveryJobState, Input, undefined, Result>;

export const accountDiscoveryIntentDefinition =
  createScanAccountsIntentDefinition<DiscoveredAccount>();

/** The completion step reuses the scan job: its items are the completion events. */
export type AccountCompletionJobState = ScanAccountsIntentJobState<AccountCompletionEvent>;
type CompletionInput = ScanAccountsIntentInput<AccountCompletionEvent>;
type CompletionResult = ScanAccountsIntentResult<AccountCompletionEvent>;

export type AccountCompletionIntentPlatformDefinition = IntentPlatformDefinition<
  AccountCompletionJobState,
  CompletionInput,
  undefined,
  CompletionResult
>;
export type AccountCompletionIntent = Intent<
  AccountCompletionJobState,
  CompletionInput,
  undefined,
  CompletionResult
>;

export const accountCompletionIntentDefinition = {
  ...createScanAccountsIntentDefinition<AccountCompletionEvent>(),
  label: "Complete accounts",
};

export type AccountDiscoveryInputs = {
  currencies: AccountDiscoveryToolProps["currencies"];
  /** The app's platform definition of the scan accounts intent, on discovered accounts. */
  intentDefinition: AccountDiscoveryIntentPlatformDefinition;
  /** Derives on the session of the app the executor opened. */
  createDerive: (connection: DeviceConnectionResult) => DeriveAccount;
  /** The env scan rules of the legacy scan, read when a scan starts, so both find the same accounts. */
  scanRules?: () => ScanRules;
  completion: {
    /** The app's platform definition of the completion intent. */
    intentDefinition: AccountCompletionIntentPlatformDefinition;
    /** Completes on the session of the app the executor opened. */
    createComplete: (connection: DeviceConnectionResult) => CompleteAccounts;
    needsCompletion: NeedsCompletion;
  };
  /** Whether the app holds the account already: it is flagged and skipped. */
  isAdded: (descriptor: AccountDescriptor) => boolean;
  /** Why the app cannot add the account from here (its family needs its own add flow); none when it can. */
  notAddableReason: (descriptor: AccountDescriptor) => string | undefined;
  /** Adds the accounts to the app: devtools cannot reach the app store. */
  addAccounts: (descriptors: readonly AccountDescriptor[]) => Promise<void>;
};

/** The intent the host mounts its Device Intent Executor with, on the app of `currencyId`: a fresh executor per run. */
export type AccountDiscoveryRun =
  | {
      readonly kind: "scan";
      readonly currencyId: CryptoCurrencyId;
      readonly intent: AccountDiscoveryIntent;
    }
  | {
      readonly kind: "complete";
      readonly currencyId: CryptoCurrencyId;
      readonly intent: AccountCompletionIntent;
    };

export type AccountDiscoveryToolState = {
  readonly toolProps: AccountDiscoveryToolProps;
  /** Null while nothing runs: the host unmounts its executor, which stops the run. */
  readonly run: AccountDiscoveryRun | null;
  /** The user closed the executor: the run stops with what it got. */
  readonly onRunCancelled: () => void;
  /** The executor could not start: the run ends with this error. */
  readonly onRunFailed: (error: unknown) => void;
};

type ScanState = Omit<AccountDiscoveryState, "selection" | "completion" | "notice" | "adding">;

type ScanEvent =
  | { type: "scan"; currencyId: CryptoCurrencyId }
  | { type: "attempt" }
  | { type: "count"; counter: keyof ScanCounters }
  | { type: "found"; items: readonly DiscoveredAccount[] }
  | { type: "end"; status: "done" | "stopped" | "error"; error?: string };

type CompletionRun = { readonly status: CompletionRunStatus; readonly error?: string };

const IDLE: ScanState = {
  status: "idle",
  rows: [],
  counters: { derivations: 0, statusReads: 0 },
};

const NO_COMPLETION: CompletionRun = { status: "idle" };

const toRow = ({ descriptor, candidate, status }: DiscoveredAccount, foundAtMs: number) => ({
  key: accountDescriptorKey(descriptor),
  derivationMode: candidate.derivationMode,
  index: candidate.index,
  used: status.used,
  gate: status.gate?.type,
  descriptor: serializeAccountDescriptor(descriptor),
  foundAtMs,
});

/** `atMs` is the time since the scan started; each account keeps the time it was first reported. */
function reduceScan(previous: ScanState, event: ScanEvent, atMs: number): ScanState {
  switch (event.type) {
    case "scan":
      return { ...IDLE, status: "scanning", currencyId: event.currencyId };
    case "attempt":
      if (previous.status !== "scanning") return previous;
      return { ...IDLE, status: "scanning", currencyId: previous.currencyId };
    case "count":
      return {
        ...previous,
        counters: { ...previous.counters, [event.counter]: previous.counters[event.counter] + 1 },
      };
    case "found":
      return {
        ...previous,
        rows: [
          ...previous.rows,
          ...event.items.slice(previous.rows.length).map(account => toRow(account, atMs)),
        ],
      };
    case "end":
      if (previous.status !== "scanning") return previous;
      return { ...previous, status: event.status, elapsedMs: atMs, error: event.error };
  }
}

function countingHost(
  host: DiscoveryHost,
  count: (counter: keyof ScanCounters) => void,
): DiscoveryHost {
  return {
    derive: (candidate, signal) => {
      count("derivations");
      return host.derive(candidate, signal);
    },
    readStatus: (descriptor, signal) => {
      count("statusReads");
      return host.readStatus(descriptor, signal);
    },
  };
}

// DMK errors may carry only their `_tag`.
function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "_tag" in error) return String(error._tag);
  return String(error);
}

const asError = (error: unknown) => (error instanceof Error ? error : new Error(messageOf(error)));

const keyOf = (account: DiscoveredAccount) => accountDescriptorKey(account.descriptor);

/** Drives the account discovery devtool: each scan, and each completion, is a Device Intent run the host mounts. */
export function useAccountDiscoveryToolState({
  currencies,
  intentDefinition,
  createDerive,
  scanRules,
  completion: { intentDefinition: completionIntentDefinition, createComplete, needsCompletion },
  isAdded,
  notAddableReason,
  addAccounts,
}: AccountDiscoveryInputs): AccountDiscoveryToolState {
  const dispatch = useDispatch<ThunkDispatch<unknown, unknown, UnknownAction>>();
  const [scan, setScan] = useState<ScanState>(IDLE);
  const [discovered, setDiscovered] = useState<readonly DiscoveredAccount[]>([]);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [completion, setCompletion] = useState<CompletionStates>(new Map());
  const [completionRun, setCompletionRun] = useState<CompletionRun>(NO_COMPLETION);
  const [notice, setNotice] = useState<string | undefined>();
  const [adding, setAdding] = useState(false);
  const [run, setRun] = useState<AccountDiscoveryRun | null>(null);
  const runRef = useRef<AccountDiscoveryRun | null>(null);
  const completionRef = useRef<CompletionStates>(completion);
  const startedAt = useRef(0);

  const changeRun = useCallback((next: AccountDiscoveryRun | null) => {
    runRef.current = next;
    setRun(next);
  }, []);

  const updateCompletion = useCallback((update: (states: CompletionStates) => CompletionStates) => {
    completionRef.current = update(completionRef.current);
    setCompletion(completionRef.current);
  }, []);

  const apply = useCallback((event: ScanEvent) => {
    if (event.type === "scan" || event.type === "attempt") startedAt.current = performance.now();
    const atMs = performance.now() - startedAt.current;
    setScan(previous => reduceScan(previous, event, atMs));
  }, []);

  const end = useCallback(
    (status: "done" | "stopped" | "error", error?: unknown) => {
      changeRun(null);
      apply({ type: "end", status, error: error === undefined ? undefined : messageOf(error) });
    },
    [apply, changeRun],
  );

  const endCompletion = useCallback(
    (status: "done" | "stopped" | "error", error?: unknown) => {
      changeRun(null);
      if (status === "error") updateCompletion(states => failPending(states, asError(error)));
      if (status !== "error") updateCompletion(dropPending);
      setCompletionRun({ status, error: error === undefined ? undefined : messageOf(error) });
    },
    [changeRun, updateCompletion],
  );

  const onRunCancelled = useCallback(() => {
    if (!runRef.current) return;
    if (runRef.current.kind === "complete") endCompletion("stopped");
    else end("stopped");
  }, [end, endCompletion]);

  const onRunFailed = useCallback(
    (error: unknown) => {
      if (!runRef.current) return;
      if (runRef.current.kind === "complete") endCompletion("error", error);
      else end("error", error);
    },
    [end, endCompletion],
  );

  const onScan = useCallback(
    (currencyId: CryptoCurrencyId) => {
      const readStatus = dispatch((_dispatch, _getState, extra) =>
        statusThroughRouter(getAccountDataRuntime(extra).router),
      );
      const options = { ...scanRules?.(), currencyId };
      const input: Input = {
        // The executor calls it again on its retry after a disconnect: the list restarts.
        startScan: connection => {
          apply({ type: "attempt" });
          return discoverAccounts(
            countingHost({ derive: createDerive(connection), readStatus }, counter =>
              apply({ type: "count", counter }),
            ),
            options,
          );
        },
      };
      const intent = createIntent(intentDefinition, input, {
        onJobStateChanged: jobState => {
          setDiscovered(jobState.items);
          apply({ type: "found", items: jobState.items });
          if (jobState.type !== "scanning") {
            end(jobState.type, jobState.type === "error" ? jobState.error : undefined);
          }
        },
        // A disconnect keeps the executor on its Disconnected screen, which retries the scan.
        onJobError: error => {
          if (!isDeviceDisconnectedError(error)) end("error", error);
        },
      });
      apply({ type: "scan", currencyId });
      setDiscovered([]);
      setSelected(new Set());
      updateCompletion(() => new Map());
      setCompletionRun(NO_COMPLETION);
      setNotice(undefined);
      changeRun({ kind: "scan", currencyId, intent });
    },
    [apply, createDerive, dispatch, end, intentDefinition, scanRules, changeRun, updateCompletion],
  );

  const selectedAccounts = useMemo(
    () =>
      discovered.filter(
        account =>
          selected.has(keyOf(account)) &&
          !isAdded(account.descriptor) &&
          notAddableReason(account.descriptor) === undefined,
      ),
    [discovered, isAdded, notAddableReason, selected],
  );

  const split = useMemo(
    () => splitSelection(selectedAccounts, needsCompletion),
    [needsCompletion, selectedAccounts],
  );

  const toComplete = useMemo(
    () =>
      split.needsComplete
        .filter(account => completion.get(keyOf(account))?.type !== "completed")
        .map(account => account.descriptor),
    [completion, split],
  );

  const toAdd = useMemo(
    () => [
      ...split.ready.map(account => ({ key: keyOf(account), descriptor: account.descriptor })),
      ...split.needsComplete.flatMap(account => {
        const state = completion.get(keyOf(account));
        return state?.type === "completed"
          ? [{ key: keyOf(account), descriptor: state.descriptor }]
          : [];
      }),
    ],
    [completion, split],
  );

  const onToggle = useCallback((key: string) => {
    setSelected(previous => {
      const next = new Set(previous);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }, []);

  const onComplete = useCallback(() => {
    const { currencyId } = scan;
    if (!currencyId || toComplete.length === 0) return;
    let attempt: readonly AccountDescriptor[] = [];
    const input: CompletionInput = {
      // The executor calls it again on its retry after a disconnect: only the accounts not settled yet are prompted.
      startScan: connection => {
        attempt = toComplete.filter(
          descriptor => !isSettled(completionRef.current.get(accountDescriptorKey(descriptor))),
        );
        return createComplete(connection)(attempt);
      },
    };
    const intent = createIntent(completionIntentDefinition, input, {
      onJobStateChanged: jobState => {
        const states = completionStates(attempt, jobState.items);
        updateCompletion(previous => mergeCompletionStates(previous, states));
        if (jobState.type !== "scanning") {
          endCompletion(jobState.type, jobState.type === "error" ? jobState.error : undefined);
        }
      },
      // A disconnect keeps the executor on its Disconnected screen, which retries the completion.
      onJobError: error => {
        if (!isDeviceDisconnectedError(error)) endCompletion("error", error);
      },
    });
    const asked = new Set(toComplete.map(accountDescriptorKey));
    // A new click asks the refused accounts again; only the executor's retry skips them.
    updateCompletion(
      states =>
        new Map([...states].filter(([key, s]) => !(asked.has(key) && s.type === "refused"))),
    );
    setNotice(undefined);
    setCompletionRun({ status: "completing" });
    changeRun({ kind: "complete", currencyId, intent });
  }, [
    completionIntentDefinition,
    createComplete,
    endCompletion,
    scan,
    changeRun,
    toComplete,
    updateCompletion,
  ]);

  const onAdd = useCallback(() => {
    if (toAdd.length === 0 || adding) return;
    setAdding(true);
    addAccounts(toAdd.map(({ descriptor }) => descriptor))
      .then(
        () => {
          setSelected(previous => {
            const next = new Set(previous);
            for (const { key } of toAdd) next.delete(key);
            return next;
          });
          setNotice(`Added ${toAdd.length} account${toAdd.length === 1 ? "" : "s"}`);
        },
        (error: unknown) => setNotice(`Add failed: ${messageOf(error)}`),
      )
      .finally(() => setAdding(false));
  }, [addAccounts, adding, toAdd]);

  const state = useMemo((): AccountDiscoveryState => {
    const byKey = new Map(discovered.map(account => [keyOf(account), account]));
    const rows = scan.rows.map((row): DiscoveredRow => {
      const account = byKey.get(row.key);
      if (!account) return row;
      return {
        ...row,
        selected: selected.has(row.key),
        added: isAdded(account.descriptor),
        notAddable: notAddableReason(account.descriptor),
        needsCompletion: needsCompletion(account.descriptor),
        completion: completion.get(row.key)?.type,
      };
    });
    return {
      ...scan,
      rows,
      selection: { completable: toComplete.length, addable: toAdd.length },
      completion: completionRun,
      notice,
      adding,
    };
  }, [
    adding,
    completion,
    completionRun,
    discovered,
    isAdded,
    needsCompletion,
    notAddableReason,
    notice,
    scan,
    selected,
    toAdd.length,
    toComplete.length,
  ]);

  const toolProps = useMemo(
    () => ({ currencies, state, onScan, onToggle, onComplete, onAdd }),
    [currencies, state, onScan, onToggle, onComplete, onAdd],
  );

  return { toolProps, run, onRunCancelled, onRunFailed };
}
