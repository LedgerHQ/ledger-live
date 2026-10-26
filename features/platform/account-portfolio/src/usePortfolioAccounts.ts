import { useEffect, useMemo, useState } from "react";
import { accountPortfolioApi, type PortfolioRegistration } from "@domain/api-account-portfolio";
import {
  isPortfolioSyncing,
  portfolioServiceAccounts,
  portfolioTotal,
  walletRegistrations,
  type PortfolioServiceAccount,
  type PortfolioWalletAccount,
} from "./portfolioAccounts";

export const PORTFOLIO_POLL_INTERVAL_MS = 4000;

export type UsePortfolioAccountsParams = {
  readonly portfolioId: string;
  readonly walletAccounts: readonly PortfolioWalletAccount[];
  /** Countervalue ticker the balances are valued in. */
  readonly currency: string;
  readonly skip?: boolean;
  readonly pollingInterval?: number;
};

export type PortfolioAccountsState = {
  readonly status: "idle" | "loading" | "ready" | "error";
  /** The failure of the current request; a stale one is never kept. */
  readonly error: unknown;
  /** Empty until the balances of `currency` are read: values of another currency are never shown. */
  readonly accounts: readonly PortfolioServiceAccount[];
  readonly total: number | null;
  readonly currency: string | undefined;
  readonly skippedCount: number;
  /** The service is still indexing; the hook polls meanwhile. */
  readonly syncing: boolean;
};

/**
 * Keeps the portfolio registering exactly the wallet's accounts, and reads their balances in
 * `currency` while mounted, polling until the service has indexed them.
 */
export function usePortfolioAccounts({
  portfolioId,
  walletAccounts,
  currency,
  skip = false,
  pollingInterval = PORTFOLIO_POLL_INTERVAL_MS,
}: UsePortfolioAccountsParams): PortfolioAccountsState {
  const { registrations, skippedCount } = useMemo(
    () => walletRegistrations(walletAccounts),
    [walletAccounts],
  );
  const registrationsKey = JSON.stringify(registrations);

  const [sync, syncResult] = accountPortfolioApi.useSyncPortfolioMutation();
  const [syncedPortfolioId, setSyncedPortfolioId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (skip) return;
    let active = true;
    const request = sync({
      portfolioId,
      registrations: JSON.parse(registrationsKey) as PortfolioRegistration[],
    });
    request
      .unwrap()
      .then(() => {
        if (active) setSyncedPortfolioId(portfolioId);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      request.abort();
    };
  }, [portfolioId, registrationsKey, skip, sync]);

  // Once synced, a later wallet change keeps showing the portfolio while it is synced again.
  const synced = !skip && syncedPortfolioId === portfolioId;

  const cached = accountPortfolioApi.endpoints.getPortfolio.useQueryState(
    { portfolioId },
    { skip: !synced },
  ).currentData;
  const syncing = cached ? isPortfolioSyncing(cached, registrations.length) : false;
  const interval = syncing ? pollingInterval : 0;

  const portfolioQuery = accountPortfolioApi.useGetPortfolioQuery(
    { portfolioId },
    { skip: !synced, refetchOnMountOrArgChange: true, pollingInterval: interval },
  );
  const portfolio = portfolioQuery.currentData;

  const balanceQuery = accountPortfolioApi.useGetBalanceSnapshotQuery(
    { portfolioId, currency },
    { skip: !synced, pollingInterval: interval, refetchOnMountOrArgChange: true },
  );
  const snapshot =
    balanceQuery.currentData?.currency === currency ? balanceQuery.currentData : undefined;

  const accounts = useMemo(
    () =>
      portfolio && snapshot
        ? portfolioServiceAccounts(portfolio, snapshot.items, walletAccounts)
        : [],
    [portfolio, snapshot, walletAccounts],
  );

  const error = syncResult.error ?? portfolioQuery.error ?? balanceQuery.error;
  const ready = portfolio !== undefined && snapshot !== undefined;

  let status: PortfolioAccountsState["status"] = "loading";
  if (skip) status = "idle";
  else if (error !== undefined && !ready) status = "error";
  else if (ready) status = "ready";

  return {
    status,
    error,
    accounts,
    total: ready ? portfolioTotal(accounts) : null,
    currency: snapshot?.currency,
    skippedCount,
    syncing,
  };
}
