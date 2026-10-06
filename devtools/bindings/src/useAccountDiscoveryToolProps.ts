import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { getAccountDataRouter } from "@domain/api-account-data-source";
import {
  accountDescriptorKey,
  accountKeyOf,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
import { discoverAccounts, type DiscoveryPorts } from "@features/platform-account-discovery";

type AccountDiscoveryToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-discovery" }
>["config"];

type State = AccountDiscoveryToolProps["state"];

export type AccountDiscoveryInputs = {
  /** The currencies a source can say `exists` for. */
  currencies: AccountDiscoveryToolProps["currencies"];
  /** Derives on the connected device, or `undefined` when there is none. */
  derive: DiscoveryPorts["derive"] | undefined;
  /** Shown when `derive` is missing: what to do to get one. */
  blockedReason: string;
};

const IDLE: State = {
  status: "idle",
  rows: [],
  counters: { derivations: 0, existenceChecks: 0 },
};

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
    (currencyId, { lookahead }) => {
      if (!derive) return;
      stop.current();

      const startedAt = performance.now();
      const elapsed = () => performance.now() - startedAt;
      const counters = { derivations: 0, existenceChecks: 0 };
      const snapshot = (): State["counters"] => ({ ...counters });

      const ports: DiscoveryPorts = {
        derive: (request, signal) => {
          counters.derivations++;
          return derive(request, signal);
        },
        exists: (descriptor: AccountDescriptor, signal) => {
          counters.existenceChecks++;
          return dispatch((_dispatch, _getState, extra) =>
            getAccountDataRouter(extra)
              .exists(descriptor, { signal })
              .then(({ exists }) => exists),
          );
        },
      };

      setState({ ...IDLE, status: "scanning", currencyId });
      const subscription = discoverAccounts(ports, { currencyId, lookahead }).subscribe({
        next: ({ descriptor, derivationMode, index, used }) =>
          setState(previous => ({
            ...previous,
            counters: snapshot(),
            rows: [
              ...previous.rows,
              {
                key: accountDescriptorKey(descriptor),
                derivationMode,
                index,
                used,
                address: accountKeyOf(descriptor),
                path: descriptor.path,
                foundAtMs: elapsed(),
              },
            ],
          })),
        error: error =>
          setState(previous => ({
            ...previous,
            status: "error",
            counters: snapshot(),
            elapsedMs: elapsed(),
            error: error instanceof Error ? error.message : String(error),
          })),
        complete: () =>
          setState(previous => ({
            ...previous,
            status: "done",
            counters: snapshot(),
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
