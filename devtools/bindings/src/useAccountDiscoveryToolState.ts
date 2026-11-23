import { useCallback, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type {
  AccountDiscoveryState,
  AccountDiscoveryToolProps,
  ScanCounters,
} from "@devtools/account-discovery";
import { getAccountDataRuntime } from "@domain/api-account-data";
import {
  accountDescriptorKey,
  serializeAccountDescriptor,
} from "@domain/entity-account-descriptor/descriptor";
import type { CryptoCurrencyId } from "@domain/entity-currency-crypto";
import type { ScanRules } from "@domain/entity-derivation";
import {
  discoverAccounts,
  statusThroughRouter,
  type DeriveAccount,
  type DiscoveredAccount,
  type DiscoveryHost,
} from "@features/platform-account-discovery/descriptor";
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

export type AccountDiscoveryInputs = {
  currencies: AccountDiscoveryToolProps["currencies"];
  /** The app's platform definition of the scan accounts intent, on discovered accounts. */
  intentDefinition: AccountDiscoveryIntentPlatformDefinition;
  /** Derives on the session of the app the executor opened. */
  createDerive: (connection: DeviceConnectionResult) => DeriveAccount;
  /** The env scan rules of the legacy scan, read when a scan starts, so both find the same accounts. */
  scanRules?: () => ScanRules;
};

/** The intent the host mounts its Device Intent Executor with, on the app of `currencyId`. */
export type AccountDiscoveryRun = {
  readonly currencyId: CryptoCurrencyId;
  readonly intent: AccountDiscoveryIntent;
};

export type AccountDiscoveryToolState = {
  readonly toolProps: AccountDiscoveryToolProps;
  /** Null while no scan runs: the host unmounts its executor, which stops the scan. */
  readonly run: AccountDiscoveryRun | null;
  /** The user closed the executor: the scan stops with what it found. */
  readonly onRunCancelled: () => void;
  /** The executor could not start: the scan ends with this error. */
  readonly onRunFailed: (error: unknown) => void;
};

type ScanEvent =
  | { type: "scan"; currencyId: CryptoCurrencyId }
  | { type: "attempt" }
  | { type: "count"; counter: keyof ScanCounters }
  | { type: "found"; items: readonly DiscoveredAccount[] }
  | { type: "end"; status: "done" | "stopped" | "error"; error?: string };

const IDLE: AccountDiscoveryState = {
  status: "idle",
  rows: [],
  counters: { derivations: 0, statusReads: 0 },
};

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
function reduceScan(
  previous: AccountDiscoveryState,
  event: ScanEvent,
  atMs: number,
): AccountDiscoveryState {
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

/** Drives the account discovery devtool: each scan is a Device Intent run the host mounts. */
export function useAccountDiscoveryToolState({
  currencies,
  intentDefinition,
  createDerive,
  scanRules,
}: AccountDiscoveryInputs): AccountDiscoveryToolState {
  const dispatch = useDispatch<ThunkDispatch<unknown, unknown, UnknownAction>>();
  const [state, setState] = useState<AccountDiscoveryState>(IDLE);
  const [run, setRun] = useState<AccountDiscoveryRun | null>(null);
  const startedAt = useRef(0);

  const apply = useCallback((event: ScanEvent) => {
    if (event.type === "scan" || event.type === "attempt") startedAt.current = performance.now();
    const atMs = performance.now() - startedAt.current;
    setState(previous => reduceScan(previous, event, atMs));
  }, []);

  const end = useCallback(
    (status: "done" | "stopped" | "error", error?: unknown) => {
      setRun(null);
      apply({ type: "end", status, error: error === undefined ? undefined : messageOf(error) });
    },
    [apply],
  );

  const onRunCancelled = useCallback(() => end("stopped"), [end]);
  const onRunFailed = useCallback((error: unknown) => end("error", error), [end]);

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
      setRun({ currencyId, intent });
    },
    [apply, createDerive, dispatch, end, intentDefinition, scanRules],
  );

  const toolProps = useMemo(() => ({ currencies, state, onScan }), [currencies, state, onScan]);

  return { toolProps, run, onRunCancelled, onRunFailed };
}
