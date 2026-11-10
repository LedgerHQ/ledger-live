import type { Portfolio } from "@domain/api-account-portfolio";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { isDummyPortfolioId, type PortfolioId } from "@domain/entity-client-identity";
import { PortfolioServiceError, type PortfolioClient } from "../client";
import { missingRegistrations, realAccounts, unneededRegistrations } from "../registration";
import { createSerialQueue, type SerialQueue } from "./queue";
import { createPortfolioStore, logActivity, recordListing, type PortfolioStore } from "./snapshot";

export type PortfolioDeps = {
  readonly client: PortfolioClient;
  readonly portfolioId: () => PortfolioId;
  /** Service writes go through it, so two batches never register the same address twice. */
  readonly queue: SerialQueue;
  readonly store: PortfolioStore;
};

/** The long-lived state of one source: its own store and serial queue. */
export const createPortfolioContext = ({
  client,
  portfolioId,
}: Pick<PortfolioDeps, "client" | "portfolioId">): PortfolioDeps => ({
  client,
  portfolioId,
  queue: createSerialQueue(),
  store: createPortfolioStore(),
});

/** Before identities load, every install holds the same placeholder id, so its portfolio is shared. */
export class PortfolioIdNotLoadedError extends Error {
  override name = "PortfolioIdNotLoadedError";
  constructor() {
    super("The install's portfolio id is not loaded yet");
  }
}

/** Only our own messages: an unknown error may carry an address. */
export const describeError = (error: unknown) =>
  error instanceof PortfolioServiceError || error instanceof PortfolioIdNotLoadedError
    ? error.message
    : "Unexpected error";

async function logged<T>(store: PortfolioStore, label: string, task: () => Promise<T>) {
  try {
    return await task();
  } catch (error) {
    logActivity(store, false, `${label} failed: ${describeError(error)}`);
    throw error;
  }
}

function pinnedPortfolioId({ portfolioId }: PortfolioDeps): PortfolioId {
  const id = portfolioId();
  if (isDummyPortfolioId(id)) throw new PortfolioIdNotLoadedError();
  return id;
}

/** One portfolio id per operation, read when it starts, so a change mid-way never mixes two portfolios. */
const queued = <T>(deps: PortfolioDeps, label: string, task: (id: PortfolioId) => Promise<T>) =>
  deps.queue.run(() =>
    deps.store.track(() => logged(deps.store, label, () => task(pinnedPortfolioId(deps)))),
  );

/** Lists the portfolio, creating it when the service does not know it. Not queued. */
export async function listPortfolio(
  { client, store }: PortfolioDeps,
  id: PortfolioId,
): Promise<Portfolio> {
  const existing = await client.getPortfolio(id);
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
  const created = await client.createPortfolio(id);
  logActivity(store, true, "Created the portfolio");
  return recordListing(store, created);
}

async function register(
  deps: PortfolioDeps,
  id: PortfolioId,
  descriptors: readonly AccountDescriptor[],
): Promise<Portfolio> {
  const portfolio = await listPortfolio(deps, id);
  const missing = missingRegistrations(portfolio, descriptors);
  if (missing.length === 0) return portfolio;
  const registered = recordListing(deps.store, await deps.client.addRegistrations(id, missing));
  logActivity(deps.store, true, `Registered ${missing.length} addresses`);
  return registered;
}

async function prune(deps: PortfolioDeps, id: PortfolioId, all: readonly AccountDescriptor[]) {
  const descriptors = realAccounts(all);
  if (descriptors.length === 0) {
    logActivity(
      deps.store,
      false,
      "Reconcile refused: with no account it would remove every registration",
    );
    return;
  }
  const portfolio = await register(deps, id, descriptors);
  const extra = unneededRegistrations(portfolio, descriptors);
  if (extra.length === 0) return;
  recordListing(
    deps.store,
    await deps.client.removeRegistrations(
      id,
      extra.map(entry => entry.id),
    ),
  );
  logActivity(deps.store, true, `Removed ${extra.length} registrations no account needs`);
}

export const refresh = (deps: PortfolioDeps): Promise<void> =>
  queued(deps, "Refresh", id => listPortfolio(deps, id)).then(() => undefined);

/** Registers what the accounts miss and removes what none of them needs; never with no account. */
export const reconcile = (
  deps: PortfolioDeps,
  descriptors: readonly AccountDescriptor[],
): Promise<void> => queued(deps, "Reconcile", id => prune(deps, id, descriptors));
