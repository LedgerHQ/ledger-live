import type { Portfolio } from "@domain/api-account-portfolio";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { PortfolioId } from "@domain/entity-client-identity";
import { PortfolioServiceError, type PortfolioClient } from "../client";
import { missingRegistrations, unneededRegistrations } from "../evm";
import type { SerialQueue } from "./queue";
import { logActivity, recordListing, type PortfolioStore } from "./snapshot";

export type PortfolioDeps = {
  readonly client: PortfolioClient;
  readonly portfolioId: () => PortfolioId;
  /** Service writes go through it, so two batches never register the same address twice. */
  readonly queue: SerialQueue;
  readonly store: PortfolioStore;
};

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

async function prune(deps: PortfolioDeps, descriptors: readonly AccountDescriptor[]) {
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

/** Registers what the accounts miss and removes what none of them needs; never with no account. */
export const reconcile = (
  deps: PortfolioDeps,
  descriptors: readonly AccountDescriptor[],
): Promise<void> =>
  queued(deps, () => logged(deps.store, "Reconcile", () => prune(deps, descriptors)));
