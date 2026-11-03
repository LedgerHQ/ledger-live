import type { Portfolio } from "@domain/api-account-portfolio";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { PortfolioId } from "@domain/entity-client-identity";
import { PortfolioServiceError, type PortfolioClient } from "../client";
import { missingRegistrations, realAccounts, unneededRegistrations } from "../registration";
import type { SerialQueue } from "./queue";
import { readinessOf } from "./readiness";
import { logActivity, recordListing, type PortfolioStore } from "./snapshot";

export type PortfolioDeps = {
  readonly client: PortfolioClient;
  readonly portfolioId: () => PortfolioId;
  /** Service writes go through it, so two batches never register the same address twice. */
  readonly queue: SerialQueue;
  readonly store: PortfolioStore;
  /** Between two listings while accounts are not ready. */
  readonly sleep: (ms: number) => Promise<void>;
  /** Resolves once a listing has run past the deadline; a timer of its own, so it never moves `now`. */
  readonly timeout: (ms: number) => Promise<void>;
  readonly now: () => number;
};

const POLL_EVERY_MS = 3_000;
const WAIT_AT_MOST_MS = 120_000;

/** Only our own messages: an unknown error may carry an address. */
export const describeError = (error: unknown) =>
  error instanceof PortfolioServiceError ? error.message : "Unexpected error";

const queued = <T>({ queue, store }: PortfolioDeps, task: () => Promise<T>) =>
  queue.run(() => store.track(task));

async function logged<T>(store: PortfolioStore, label: string, task: () => Promise<T>) {
  try {
    return await task();
  } catch (error) {
    logActivity(store, false, `${label} failed: ${describeError(error)}`);
    throw error;
  }
}

/** Lists the portfolio, creating it when the service does not know it. Not queued. */
export async function listPortfolio({
  client,
  portfolioId,
  store,
}: PortfolioDeps): Promise<Portfolio> {
  const existing = await client.getPortfolio(portfolioId());
  if (existing) {
    const registrations = existing.registrations?.length ?? 0;
    const accounts = existing.accounts?.length ?? 0;
    logActivity(
      store,
      true,
      `Listed: ${registrations} registrations, ${accounts} service accounts`,
    );
    return recordListing(store, existing);
  }
  const created = await client.createPortfolio(portfolioId());
  logActivity(store, true, "Created the portfolio");
  return recordListing(store, created);
}

async function register(
  deps: PortfolioDeps,
  descriptors: readonly AccountDescriptor[],
): Promise<Portfolio> {
  const portfolio = await listPortfolio(deps);
  const missing = missingRegistrations(portfolio, descriptors);
  if (missing.length === 0) return portfolio;
  const registered = recordListing(
    deps.store,
    await deps.client.addRegistrations(deps.portfolioId(), missing),
  );
  logActivity(deps.store, true, `Registered ${missing.length} addresses`);
  return registered;
}

async function prune(deps: PortfolioDeps, all: readonly AccountDescriptor[]) {
  const descriptors = realAccounts(all);
  if (descriptors.length === 0) {
    logActivity(
      deps.store,
      false,
      "Reconcile refused: with no account it would remove every registration",
    );
    return;
  }
  const portfolio = await register(deps, descriptors);
  const extra = unneededRegistrations(portfolio, descriptors);
  if (extra.length === 0) return;
  recordListing(
    deps.store,
    await deps.client.removeRegistrations(
      deps.portfolioId(),
      extra.map(entry => entry.id),
    ),
  );
  logActivity(deps.store, true, `Removed ${extra.length} registrations no account needs`);
}

export const refresh = (deps: PortfolioDeps): Promise<void> =>
  queued(deps, () => logged(deps.store, "Refresh", () => listPortfolio(deps))).then(
    () => undefined,
  );

/** Lists the portfolio and registers the addresses it misses; returns the latest listing. */
export const registerMissing = (deps: PortfolioDeps, descriptors: readonly AccountDescriptor[]) =>
  queued(deps, () => register(deps, descriptors));

/**
 * Registers what the accounts miss, then lists the portfolio again until none of them is pending,
 * for two minutes at most: a read of an account the service is still preparing blocks meanwhile.
 */
export async function whenReady(
  deps: PortfolioDeps,
  descriptors: readonly AccountDescriptor[],
): Promise<Portfolio> {
  const registered = await registerMissing(deps, descriptors);
  const pendingIn = (portfolio: Portfolio) =>
    descriptors.filter(descriptor => readinessOf(descriptor, portfolio).state === "pending").length;
  if (pendingIn(registered) === 0) return registered;
  logActivity(deps.store, true, `Waiting for ${pendingIn(registered)} service accounts`);
  const deadline = deps.now() + WAIT_AT_MOST_MS;
  const poll = async (portfolio: Portfolio): Promise<Portfolio> => {
    const left = deadline - deps.now();
    if (pendingIn(portfolio) === 0 || left <= 0) return portfolio;
    await deps.sleep(Math.min(POLL_EVERY_MS, left));
    // A listing still running at the deadline is aborted, so the next call does not reuse it.
    const listing = new AbortController();
    const listed = await Promise.race([
      deps.client.getPortfolio(deps.portfolioId(), listing.signal),
      deps.timeout(Math.max(0, deadline - deps.now())).then(() => undefined),
    ]).finally(() => listing.abort());
    return poll(listed ? recordListing(deps.store, listed) : portfolio);
  };
  return deps.store.track(() => poll(registered));
}

/** Registers what the accounts miss and removes what none of them needs; never with no account. */
export const reconcile = (
  deps: PortfolioDeps,
  descriptors: readonly AccountDescriptor[],
): Promise<void> =>
  queued(deps, () => logged(deps.store, "Reconcile", () => prune(deps, descriptors)));
