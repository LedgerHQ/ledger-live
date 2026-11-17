import { useCallback, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { getAccountDataRuntime } from "@domain/api-account-data";
import {
  accountDescriptorKey,
  serializeAccountDescriptor,
} from "@domain/entity-account-descriptor";
import {
  discoverAccounts,
  statusThroughRouter,
  type DeriveAccount,
  type DiscoverOptions,
  type DiscoveredAccount,
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

type AccountDiscoveryToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-discovery" }
>["config"];

type State = AccountDiscoveryToolProps["state"];
type Row = State["rows"][number];

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
  scanRules?: () => Pick<DiscoverOptions, "keychainObservableRange" | "showLegacyNewAccount">;
};

/** The intent the host mounts its Device Intent Executor with, on the app of `currencyId`. */
export type AccountDiscoveryRun = {
  readonly currencyId: string;
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

const since = (start: { current: number }) => performance.now() - start.current;

// Device errors are often plain objects tagged by `_tag` (DMK).
function messageOf(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    if ("message" in error && typeof error.message === "string" && error.message) {
      return error.message;
    }
    if ("_tag" in error && typeof error._tag === "string") return error._tag;
  }
  return String(error);
}

const IDLE: State = { status: "idle", rows: [], counters: { derivations: 0, statusReads: 0 } };

const toRow = ({ descriptor, candidate, status }: DiscoveredAccount, foundAtMs: number): Row => ({
  key: accountDescriptorKey(descriptor),
  derivationMode: candidate.derivationMode,
  index: candidate.index,
  used: status.used,
  gate: status.gate?.type,
  descriptor: serializeAccountDescriptor(descriptor),
  foundAtMs,
});

/** Drives the account discovery devtool: each scan is a Device Intent run the host mounts. */
export function useAccountDiscoveryToolState({
  currencies,
  intentDefinition,
  createDerive,
  scanRules,
}: AccountDiscoveryInputs): AccountDiscoveryToolState {
  const dispatch = useDispatch<ThunkDispatch<unknown, unknown, UnknownAction>>();
  const [state, setState] = useState<State>(IDLE);
  const [run, setRun] = useState<AccountDiscoveryRun | null>(null);
  const startedAt = useRef(0);

  const stop = useCallback(() => {
    setRun(null);
    setState(previous =>
      previous.status === "scanning"
        ? { ...previous, status: "stopped", elapsedMs: since(startedAt) }
        : previous,
    );
  }, []);

  const fail = useCallback((error: unknown) => {
    setRun(null);
    setState(previous => ({
      ...previous,
      status: "error",
      elapsedMs: since(startedAt),
      error: messageOf(error),
    }));
  }, []);

  const onScan = useCallback<AccountDiscoveryToolProps["onScan"]>(
    currencyId => {
      startedAt.current = performance.now();
      const counters = { derivations: 0, statusReads: 0 };
      const count = (counter: keyof typeof counters) => {
        counters[counter]++;
        setState(previous => ({ ...previous, counters: { ...counters } }));
      };
      const readStatus = dispatch((_dispatch, _getState, extra) =>
        statusThroughRouter(getAccountDataRuntime(extra).router),
      );
      const onJobState = (jobState: AccountDiscoveryJobState) =>
        setState(previous => {
          // A retry (after a disconnect, maybe another device) restarts the list from its own accounts.
          const kept = jobState.items.length < previous.rows.length ? [] : previous.rows;
          // Each account keeps the time the scan first reported it.
          const rows = [
            ...kept,
            ...jobState.items.slice(kept.length).map(account => toRow(account, since(startedAt))),
          ];
          switch (jobState.type) {
            case "scanning":
              return {
                ...previous,
                rows,
                status: "scanning",
                elapsedMs: undefined,
                error: undefined,
              };
            case "done":
              return { ...previous, rows, status: "done", elapsedMs: since(startedAt) };
            case "error":
              return {
                ...previous,
                rows,
                status: "error",
                elapsedMs: since(startedAt),
                error: jobState.error.message,
              };
          }
        });
      const options = { ...scanRules?.(), currencyId };
      const input: Input = {
        startScan: connection => {
          const derive = createDerive(connection);
          return discoverAccounts(
            {
              derive: (candidate, signal) => {
                count("derivations");
                return derive(candidate, signal);
              },
              readStatus: (descriptor, signal) => {
                count("statusReads");
                return readStatus(descriptor, signal);
              },
            },
            options,
          );
        },
      };
      const intent = createIntent(intentDefinition, input, {
        onJobStateChanged: onJobState,
        onJobComplete: () => setRun(null),
        onJobError: error => {
          // The executor stays mounted on its Disconnected screen and retries the scan.
          if (isDeviceDisconnectedError(error)) {
            setState(previous => ({ ...previous, error: messageOf(error) }));
            return;
          }
          fail(error);
        },
      });
      setState({ ...IDLE, status: "scanning", currencyId });
      setRun({ currencyId, intent });
    },
    [createDerive, dispatch, fail, intentDefinition, scanRules],
  );

  const toolProps = useMemo(
    () => ({ currencies, state, onScan, onStop: stop }),
    [currencies, state, onScan, stop],
  );

  // A disconnect while opening the app keeps the executor, for its Disconnected screen and retry.
  const onRunFailed = useCallback(
    (error: unknown) => {
      if (!isDeviceDisconnectedError(error)) fail(error);
    },
    [fail],
  );

  return { toolProps, run, onRunCancelled: stop, onRunFailed };
}
