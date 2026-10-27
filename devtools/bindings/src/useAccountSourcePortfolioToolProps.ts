import { useCallback, useMemo } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import type { Store, ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { addAccountDataSource } from "@domain/api-account-data";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import { portfolioIdSelector, type IdentitiesState } from "@domain/entity-client-identity";
import {
  createPortfolioSource,
  createPortfolioSourceRuntime,
  portfolioActivityCleared,
  portfolioSourceEnabled,
  registrationKey,
  strategyOf,
  type PortfolioPorts,
  type PortfolioSourceRuntime,
  type WithPortfolioSource,
} from "@features/platform-account-source-portfolio";
import type { AccountDataRecorder } from "./accountDataRecorder";
import { accountLabel } from "./accountLabel";

type PortfolioSourceToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-source-portfolio" }
>["config"];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = WithPortfolioSource & { accountEntries: AccountsState; identities: IdentitiesState };

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

/** Errors land in the source's activity: the button has nothing more to say. */
const ignore = () => undefined;

/** Per store: one runtime, and the remover of the injected source, which outlives the tool. */
const runtimes = new WeakMap<Store, PortfolioSourceRuntime>();
const removers = new WeakMap<Store, () => void>();

export type AccountSourcePortfolioToolOptions = {
  readonly serviceUrl: string;
  /** Records the calls of the injected source like those of the ranked ones. */
  readonly recorder?: AccountDataRecorder;
  /** The service calls, the Portfolio RTK Query endpoints by default. */
  readonly createRuntime?: () => PortfolioSourceRuntime;
};

/** On, the source is injected first in the store's router; off, it is removed. */
export function useAccountSourcePortfolioToolProps({
  serviceUrl,
  recorder,
  createRuntime = createPortfolioSourceRuntime,
}: AccountSourcePortfolioToolOptions): PortfolioSourceToolProps {
  const dispatch = useDispatch<ThunkDispatch<State, unknown, UnknownAction>>();
  const store = useStore<State>();
  const runtime = useMemo(() => {
    const existing = runtimes.get(store);
    if (existing) return existing;
    const created = createRuntime();
    runtimes.set(store, created);
    return created;
  }, [store, createRuntime]);
  const ports = useMemo<PortfolioPorts>(
    () => ({
      dispatch,
      getState: store.getState,
      portfolioId: () => portfolioIdSelector(store.getState()),
    }),
    [dispatch, store],
  );
  const entries = useSelector(selectAccountEntries);
  const source = useSelector((state: State) => state.accountSourcePortfolio);
  const portfolio = source.server?.portfolio;

  // Each account's registration, computed once per accounts change.
  const covered = useMemo(
    () =>
      entries.map(entry => {
        const strategy = strategyOf(entry.descriptor);
        return { ...entry, strategy, key: strategy && registrationKey(strategy.registration) };
      }),
    [entries],
  );

  const accounts = useMemo(() => {
    const registered = new Set((portfolio?.registrations ?? []).map(registrationKey));
    const statuses = new Map(portfolio?.accounts?.map(account => [account.id, account.status]));
    return covered.map(({ accountUUID, descriptor, strategy, key }) => {
      const ids =
        (strategy && portfolio && strategy.strategy.accountIdsOf(descriptor, portfolio)) ?? [];
      return {
        accountUUID,
        label: accountLabel(descriptor),
        registration: strategy && JSON.stringify(strategy.registration, null, 2),
        registered: key !== undefined && registered.has(key),
        serverAccounts: ids.map(id => ({ id, status: statuses.get(id) ?? "unknown" })),
        outcome: source.outcomes[accountUUID],
      };
    });
  }, [covered, portfolio, source.outcomes]);

  const extraRegistrations = useMemo(() => {
    const wanted = new Set(covered.flatMap(({ key }) => (key ? [key] : [])));
    return (portfolio?.registrations ?? [])
      .filter(entry => {
        const key = registrationKey(entry);
        return key === undefined || !wanted.has(key);
      })
      .map(entry => ({
        id: entry.id,
        type: entry.type,
        label: entry.address ?? entry.xpub ?? entry.network ?? entry.id,
      }));
  }, [covered, portfolio]);

  const serverStatuses = useMemo(() => {
    const counts = new Map<string, number>();
    portfolio?.accounts?.forEach(({ status }) => counts.set(status, (counts.get(status) ?? 0) + 1));
    return [...counts].map(([status, count]) => ({ status, count }));
  }, [portfolio]);

  const descriptors = useMemo(() => entries.map(({ descriptor }) => descriptor), [entries]);

  const onToggleEnabled = useCallback(
    (enabled: boolean) => {
      removers.get(store)?.();
      removers.delete(store);
      if (enabled && serviceUrl) {
        const created = createPortfolioSource({ runtime, ports });
        const [added] = recorder ? recorder.instrument([created]) : [created];
        removers.set(store, dispatch(addAccountDataSource(added, { first: true })));
      }
      dispatch(portfolioSourceEnabled(removers.has(store)));
    },
    [store, runtime, ports, recorder, serviceUrl, dispatch],
  );
  const onRefresh = useCallback(() => runtime.refresh(ports).catch(ignore), [runtime, ports]);
  const onReconcile = useCallback(
    () => runtime.reconcile(ports, descriptors).catch(ignore),
    [runtime, ports, descriptors],
  );
  const onClearActivity = useCallback(() => dispatch(portfolioActivityCleared()), [dispatch]);

  return {
    serviceUrl,
    enabled: source.enabled,
    listedAt: source.server?.at,
    serverStatuses,
    accounts,
    extraRegistrations,
    activity: source.activity,
    busy: source.busy > 0,
    onToggleEnabled,
    onRefresh,
    onReconcile,
    onClearActivity,
  };
}
