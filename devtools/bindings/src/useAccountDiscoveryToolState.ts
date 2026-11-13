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
  statusThroughRouter,
  type DiscoverOptions,
  type DiscoveredAccount,
} from "@features/platform-account-discovery";
import type {
  AccountDiscoveryIntent,
  AccountDiscoveryIntentInput,
  AccountDiscoveryIntentJobState,
  AccountDiscoveryIntentPlatformDefinition,
} from "@features/platform-account-discovery-intent";
import { createIntent } from "@features/platform-device-intent";

type AccountDiscoveryToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-discovery" }
>["config"];

type State = AccountDiscoveryToolProps["state"];
type Row = State["rows"][number];

export type AccountDiscoveryInputs = {
  currencies: AccountDiscoveryToolProps["currencies"];
  /** The app's platform definition of the account discovery intent. */
  intentDefinition: AccountDiscoveryIntentPlatformDefinition;
  /** Derives on the session of the app the executor opened. */
  createDerive: AccountDiscoveryIntentInput["createDerive"];
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
};

const since = (start: { current: number }) => performance.now() - start.current;

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

  const onScan = useCallback<AccountDiscoveryToolProps["onScan"]>(
    (currencyId, { window, lookahead }) => {
      startedAt.current = performance.now();
      const counters = { derivations: 0, statusReads: 0 };
      const count = (counter: keyof typeof counters) => {
        counters[counter]++;
        setState(previous => ({ ...previous, counters: { ...counters } }));
      };
      const readStatus = dispatch((_dispatch, _getState, extra) =>
        statusThroughRouter(getAccountDataRuntime(extra).router),
      );
      const onJobState = (jobState: AccountDiscoveryIntentJobState) =>
        setState(previous => {
          // A retry (after a disconnect, maybe another device) restarts the list from its own accounts.
          const kept = jobState.discovered.length < previous.rows.length ? [] : previous.rows;
          // Each account keeps the time the scan first reported it.
          const rows = [
            ...kept,
            ...jobState.discovered
              .slice(kept.length)
              .map(account => toRow(account, since(startedAt))),
          ];
          switch (jobState.type) {
            case "scanning":
              return { ...previous, rows, status: "scanning", error: undefined };
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
      const input: AccountDiscoveryIntentInput = {
        options: { ...scanRules?.(), currencyId, window, lookahead },
        createDerive: connection => {
          const derive = createDerive(connection);
          return (candidate, signal) => {
            count("derivations");
            return derive(candidate, signal);
          };
        },
        readStatus: (descriptor, signal) => {
          count("statusReads");
          return readStatus(descriptor, signal);
        },
      };
      const intent = createIntent(intentDefinition, input, {
        onJobStateChanged: onJobState,
        onJobComplete: () => setRun(null),
        onJobError: error =>
          setState(previous => ({
            ...previous,
            status: "error",
            elapsedMs: since(startedAt),
            error: error instanceof Error ? error.message : String(error),
          })),
      });
      setState({ ...IDLE, status: "scanning", currencyId });
      setRun({ currencyId, intent });
    },
    [createDerive, dispatch, intentDefinition, scanRules],
  );

  const toolProps = useMemo(
    () => ({ currencies, state, onScan, onStop: stop }),
    [currencies, state, onScan, stop],
  );

  return { toolProps, run, onRunCancelled: stop };
}
