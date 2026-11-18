import type { Portfolio } from "@domain/api-account-portfolio";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { isDummyPortfolioId, type PortfolioId } from "@domain/entity-client-identity";
import { PortfolioServiceError, type PortfolioClient } from "../client";
import { missingRegistrations, realAccounts, unneededRegistrations } from "../registration";
import { createSerialQueue, type SerialQueue } from "./queue";
import { readinessOf } from "./readiness";
import { createPortfolioStore, logActivity, recordListing, type PortfolioStore } from "./snapshot";

export type PortfolioDeps = {
  readonly client: PortfolioClient;
  readonly portfolioId: () => PortfolioId;
  /** Service writes go through it, so two batches never register the same address twice. */
  readonly queue: SerialQueue;
  readonly store: PortfolioStore;
  /** Between two listings while accounts are not ready; returns early once `signal` aborts. */
  readonly sleep: (ms: number, signal?: AbortSignal) => Promise<void>;
  /** Resolves once a listing has run past the deadline, or once `signal` aborts; a timer of its own, so it never moves `now`. */
  readonly timeout: (ms: number, signal: AbortSignal) => Promise<void>;
  readonly now: () => number;
};

/** The long-lived state of one source: its own store and serial queue. */
export const createPortfolioContext = (
  options: Omit<PortfolioDeps, "queue" | "store">,
): PortfolioDeps => ({ ...options, queue: createSerialQueue(), store: createPortfolioStore() });

const POLL_EVERY_MS = 3_000;
const WAIT_AT_MOST_MS = 120_000;

/** Before identities load, every install holds the same placeholder id, so its portfolio is shared. */
export class PortfolioIdNotLoadedError extends Error {
  override name = "PortfolioIdNotLoadedError";
  constructor() {
    super("The install's portfolio id is not loaded yet");
  }
}

/** Every read of a batch was cancelled while it waited for its accounts. */
export class PortfolioReadCancelledError extends Error {
  override name = "PortfolioReadCancelledError";
  constructor() {
    super("No read waits for these accounts any more");
  }
}

/** Only our own messages: an unknown error may carry an address. */
export const describeError = (error: unknown) =>
  error instanceof PortfolioServiceError ||
  error instanceof PortfolioIdNotLoadedError ||
  error instanceof PortfolioReadCancelledError
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
const inQueue = <T>(deps: PortfolioDeps, task: (id: PortfolioId) => Promise<T>) =>
  deps.queue.run(() => deps.store.track(() => task(pinnedPortfolioId(deps))));

const queued = <T>(deps: PortfolioDeps, label: string, task: (id: PortfolioId) => Promise<T>) =>
  deps.queue.run(() =>
    deps.store.track(() => logged(deps.store, label, () => task(pinnedPortfolioId(deps)))),
  );

/** Lists the portfolio, creating it when the service does not know it. Not queued. */
export async function listPortfolio(
  { client, store }: PortfolioDeps,
  id: PortfolioId,
  signal?: AbortSignal,
): Promise<Portfolio> {
  const existing = await client.getPortfolio(id, signal);
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
  signal?: AbortSignal,
): Promise<Portfolio> {
  const portfolio = await listPortfolio(deps, id, signal);
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

/** A listing and the portfolio id it was made with, which the reads that follow use too. */
export type ReadyPortfolio = { readonly id: PortfolioId; readonly portfolio: Portfolio };

/** Lists the portfolio and registers the addresses it misses; returns the latest listing. `signal` aborts the listing, never a registration. */
export const registerMissing = (
  deps: PortfolioDeps,
  descriptors: readonly AccountDescriptor[],
  signal?: AbortSignal,
): Promise<ReadyPortfolio> =>
  inQueue(deps, async id => ({ id, portfolio: await register(deps, id, descriptors, signal) }));

/**
 * Registers what the accounts miss, then lists the portfolio again until none of them is pending,
 * for two minutes at most: a read of an account the service is still preparing blocks meanwhile.
 * Once `signal` aborts, the wait stops, with its listing in flight, and frees the source.
 */
export async function whenReady(
  deps: PortfolioDeps,
  descriptors: readonly AccountDescriptor[],
  signal?: AbortSignal,
): Promise<ReadyPortfolio> {
  const stopIfCancelled = () => {
    if (signal?.aborted) throw new PortfolioReadCancelledError();
  };
  stopIfCancelled();
  const { id, portfolio: registered } = await registerMissing(deps, descriptors, signal).catch(
    (error: unknown) => {
      stopIfCancelled();
      throw error;
    },
  );
  stopIfCancelled();
  const pendingIn = (portfolio: Portfolio) =>
    descriptors.filter(descriptor => readinessOf(descriptor, portfolio).state === "pending").length;
  if (pendingIn(registered) === 0) return { id, portfolio: registered };
  logActivity(deps.store, true, `Waiting for ${pendingIn(registered)} service accounts`);
  const deadline = deps.now() + WAIT_AT_MOST_MS;
  const poll = async (portfolio: Portfolio): Promise<Portfolio> => {
    const left = deadline - deps.now();
    if (pendingIn(portfolio) === 0 || left <= 0) return portfolio;
    await deps.sleep(Math.min(POLL_EVERY_MS, left), signal);
    stopIfCancelled();
    // Settling aborts both: a listing still running at the deadline, so the next call does not reuse it, and the timer.
    const listing = new AbortController();
    const stopListing = () => listing.abort();
    signal?.addEventListener("abort", stopListing, { once: true });
    const listed = await Promise.race([
      deps.client.getPortfolio(id, listing.signal),
      deps.timeout(Math.max(0, deadline - deps.now()), listing.signal).then(() => undefined),
    ])
      .catch((error: unknown) => {
        stopIfCancelled();
        throw error;
      })
      .finally(() => {
        listing.abort();
        signal?.removeEventListener("abort", stopListing);
      });
    stopIfCancelled();
    return poll(listed ? recordListing(deps.store, listed) : portfolio);
  };
  return { id, portfolio: await deps.store.track(() => poll(registered)) };
}

/** Registers what the accounts miss and removes what none of them needs; never with no account. */
export const reconcile = (
  deps: PortfolioDeps,
  descriptors: readonly AccountDescriptor[],
): Promise<void> => queued(deps, "Reconcile", id => prune(deps, id, descriptors));
