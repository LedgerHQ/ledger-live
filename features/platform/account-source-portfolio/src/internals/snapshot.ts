import type { Portfolio } from "@domain/api-account-portfolio";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { PortfolioActivity, PortfolioOutcome, PortfolioSourceSnapshot } from "../types";

const MAX_ACTIVITY = 200;

export const EMPTY_SNAPSHOT: PortfolioSourceSnapshot = { outcomes: {}, activity: [], busy: false };

export const withListing = (
  snapshot: PortfolioSourceSnapshot,
  portfolio: Portfolio,
  at: number,
): PortfolioSourceSnapshot => ({ ...snapshot, listing: { portfolio, at } });

export const withOutcomes = (
  snapshot: PortfolioSourceSnapshot,
  entries: readonly (readonly [AccountUUID, PortfolioOutcome])[],
): PortfolioSourceSnapshot => ({
  ...snapshot,
  outcomes: { ...snapshot.outcomes, ...Object.fromEntries(entries) },
});

/** Keeps the last 200 entries; ids keep counting from the newest one. */
export function withActivity(
  snapshot: PortfolioSourceSnapshot,
  entry: Omit<PortfolioActivity, "id">,
): PortfolioSourceSnapshot {
  const id = (snapshot.activity.at(-1)?.id ?? -1) + 1;
  return { ...snapshot, activity: [...snapshot.activity, { id, ...entry }].slice(-MAX_ACTIVITY) };
}

export const withBusy = (
  snapshot: PortfolioSourceSnapshot,
  busy: boolean,
): PortfolioSourceSnapshot => ({ ...snapshot, busy });

export type SnapshotStore<T> = {
  get(): T;
  set(next: T): void;
  subscribe(listener: () => void): () => void;
};

/** `get` returns the same object until the next `set`, as `useSyncExternalStore` requires. */
export function createSnapshotStore<T>(initial: T): SnapshotStore<T> {
  let current = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set(next) {
      current = next;
      listeners.forEach(listener => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type PortfolioStore = SnapshotStore<PortfolioSourceSnapshot> & {
  /** Runs the task with `busy` set while any tracked task is in flight. */
  track<T>(task: () => Promise<T>): Promise<T>;
};

export function createPortfolioStore(): PortfolioStore {
  const store = createSnapshotStore(EMPTY_SNAPSHOT);
  let inFlight = 0;
  return {
    ...store,
    async track(task) {
      inFlight += 1;
      store.set(withBusy(store.get(), true));
      try {
        return await task();
      } finally {
        inFlight -= 1;
        store.set(withBusy(store.get(), inFlight > 0));
      }
    },
  };
}

export const logActivity = (store: PortfolioStore, ok: boolean, summary: string) =>
  store.set(withActivity(store.get(), { at: Date.now(), ok, summary }));

export function recordListing(store: PortfolioStore, portfolio: Portfolio): Portfolio {
  store.set(withListing(store.get(), portfolio, Date.now()));
  return portfolio;
}

export const recordOutcomes = (
  store: PortfolioStore,
  entries: readonly (readonly [AccountUUID, PortfolioOutcome])[],
) => store.set(withOutcomes(store.get(), entries));
