import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  existsThroughRouter,
  type DeriveAccount,
  type DiscoveryHost,
} from "@features/platform-account-discovery";

type AccountDiscoveryToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-discovery" }
>["config"];

type State = AccountDiscoveryToolProps["state"];

export type AccountDiscoveryInputs = {
  currencies: AccountDiscoveryToolProps["currencies"];
  /** Derives on the connected device, or `undefined` when there is none. */
  derive: DeriveAccount | undefined;
  /** Shown when `derive` is missing: what to do to get one. */
  blockedReason: string;
};

const IDLE: State = { status: "idle", rows: [], counters: { derivations: 0, existenceChecks: 0 } };

export function useAccountDiscoveryToolProps({
  currencies,
  derive,
  blockedReason,
}: AccountDiscoveryInputs): AccountDiscoveryToolProps {
  const dispatch = useDispatch<ThunkDispatch<unknown, unknown, UnknownAction>>();
  const [state, setState] = useState<State>(IDLE);
  const stop = useRef<() => void>(() => undefined);

  useEffect(() => () => stop.current(), []);

  const onScan = useCallback<AccountDiscoveryToolProps["onScan"]>(
    (currencyId, { window, lookahead }) => {
      if (!derive) return;
      stop.current();

      const startedAt = performance.now();
      const elapsed = () => performance.now() - startedAt;
      const counters = { derivations: 0, existenceChecks: 0 };
      const exists = dispatch((_dispatch, _getState, extra) =>
        existsThroughRouter(getAccountDataRuntime(extra).router),
      );
      const host: DiscoveryHost = {
        derive: (candidate, signal) => {
          counters.derivations++;
          return derive(candidate, signal);
        },
        exists: (descriptor, signal) => {
          counters.existenceChecks++;
          return exists(descriptor, signal);
        },
      };

      setState({ ...IDLE, status: "scanning", currencyId });
      const subscription = discoverAccounts(host, { currencyId, window, lookahead }).subscribe({
        next: ({ descriptor, candidate, used }) =>
          setState(previous => ({
            ...previous,
            counters: { ...counters },
            rows: [
              ...previous.rows,
              {
                key: accountDescriptorKey(descriptor),
                derivationMode: candidate.derivationMode,
                index: candidate.index,
                used,
                descriptor: serializeAccountDescriptor(descriptor),
                foundAtMs: elapsed(),
              },
            ],
          })),
        error: error =>
          setState(previous => ({
            ...previous,
            status: "error",
            counters: { ...counters },
            elapsedMs: elapsed(),
            error: error instanceof Error ? error.message : String(error),
          })),
        complete: () =>
          setState(previous => ({
            ...previous,
            status: "done",
            counters: { ...counters },
            elapsedMs: elapsed(),
          })),
      });
      stop.current = () => subscription.unsubscribe();
    },
    [derive, dispatch],
  );

  const onStop = useCallback(() => {
    stop.current();
    setState(previous => ({ ...previous, status: "done" }));
  }, []);

  return useMemo(
    () => ({
      currencies,
      state,
      onScan,
      onStop,
      blockedReason: derive ? undefined : blockedReason,
    }),
    [currencies, state, onScan, onStop, derive, blockedReason],
  );
}
