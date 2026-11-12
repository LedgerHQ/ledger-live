import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import type { Store, ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { addAccountDataSource } from "@domain/api-account-data";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { portfolioIdSelector, type IdentitiesState } from "@domain/entity-client-identity";
import {
  createPortfolioSource,
  portfolioAccountOf,
  registrationKey,
  unneededRegistrations,
  type PortfolioClient,
  type PortfolioSource,
} from "@features/platform-account-source-portfolio";
import type { AccountDataRecorder } from "./accountDataRecorder";

type PortfolioSourceToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-source-portfolio" }
>["config"];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = { accountEntries: AccountsState; identities: IdentitiesState };

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

/** Outlives the tool and is shared by every panel on the store: the source stays injected while DevTools is closed. */
type Handle = {
  readonly portfolio: PortfolioSource;
  isInjected(): boolean;
  subscribe(listener: () => void): () => void;
  /** Removes the injected source, then injects again when given how. */
  reinject(inject?: () => () => void): void;
};
const handles = new WeakMap<Store, Handle>();

function createHandle(portfolio: PortfolioSource): Handle {
  let remove: (() => void) | undefined;
  const listeners = new Set<() => void>();
  return {
    portfolio,
    isInjected: () => remove !== undefined,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reinject(inject) {
      remove?.();
      remove = inject?.();
      listeners.forEach(listener => listener());
    },
  };
}

const labelOf = (descriptor: AccountDescriptor) =>
  `${descriptor.network} ${
    descriptor.type === "utxo" ? `${descriptor.xpub.slice(0, 12)}…` : descriptor.address
  }`;

/** Errors land in the source's activity log. */
const ignore = () => undefined;

export type AccountSourcePortfolioToolOptions = {
  readonly serviceUrl: string;
  /** Records the calls of the injected source like those of the ranked ones. */
  readonly recorder?: AccountDataRecorder;
  /** The service calls, the Portfolio RTK Query endpoints by default. */
  readonly client?: PortfolioClient;
};

export function useAccountSourcePortfolioToolProps({
  serviceUrl,
  recorder,
  client,
}: AccountSourcePortfolioToolOptions): PortfolioSourceToolProps {
  const store = useStore<State>();
  const dispatch = useDispatch<ThunkDispatch<State, unknown, UnknownAction>>();
  const handle = useMemo(() => {
    const existing = handles.get(store);
    if (existing) return existing;
    const portfolio = createPortfolioSource({
      dispatch,
      portfolioId: () => portfolioIdSelector(store.getState()),
      client,
    });
    const created = createHandle(portfolio);
    handles.set(store, created);
    return created;
  }, [store, dispatch, client]);
  const enabled = useSyncExternalStore(handle.subscribe, handle.isInjected);
  const snapshot = useSyncExternalStore(handle.portfolio.subscribe, handle.portfolio.getSnapshot);
  const entries = useSelector(selectAccountEntries);
  const descriptors = useMemo(() => entries.map(({ descriptor }) => descriptor), [entries]);
  const portfolio = snapshot.listing?.portfolio;

  const accounts = useMemo(() => {
    const registered = new Set(
      (portfolio?.registrations ?? []).flatMap(entry => registrationKey(entry) ?? []),
    );
    const statuses = new Map(portfolio?.accounts?.map(account => [account.id, account.status]));
    return entries.map(({ accountUUID, descriptor }) => {
      const base = {
        accountUUID,
        label: labelOf(descriptor),
        outcome: snapshot.outcomes[accountUUID],
      };
      const ref = descriptor.purpose === "account" ? portfolioAccountOf(descriptor) : undefined;
      if (!ref) return { ...base, supported: false, registered: false };
      const key = registrationKey(ref.registration);
      return {
        ...base,
        supported: true,
        registered: key !== undefined && registered.has(key),
        serverAccountId: ref.serverAccountId,
        serverStatus: statuses.get(ref.serverAccountId),
      };
    });
  }, [entries, portfolio, snapshot.outcomes]);

  const extraRegistrations = useMemo(
    () =>
      portfolio
        ? unneededRegistrations(portfolio, descriptors).map(entry => ({
            id: entry.id,
            type: entry.type,
            label:
              entry.address ??
              entry.xpub ??
              entry.addresses?.join(", ") ??
              entry.network ??
              entry.id,
          }))
        : [],
    [portfolio, descriptors],
  );

  const onToggleEnabled = useCallback(
    (on: boolean) => {
      const { source } = handle.portfolio;
      const injected = recorder ? (recorder.instrument([source])[0] ?? source) : source;
      handle.reinject(
        on && serviceUrl
          ? () => dispatch(addAccountDataSource(injected, { first: true }))
          : undefined,
      );
    },
    [handle, serviceUrl, recorder, dispatch],
  );
  const onRefresh = useCallback(() => {
    handle.portfolio.refresh().catch(ignore);
  }, [handle]);
  const onReconcile = useCallback(() => {
    handle.portfolio.reconcile(descriptors).catch(ignore);
  }, [handle, descriptors]);

  return {
    serviceUrl,
    enabled,
    listedAt: snapshot.listing?.at,
    accounts,
    extraRegistrations,
    activity: snapshot.activity,
    busy: snapshot.busy,
    onToggleEnabled,
    onRefresh,
    onReconcile,
  };
}
