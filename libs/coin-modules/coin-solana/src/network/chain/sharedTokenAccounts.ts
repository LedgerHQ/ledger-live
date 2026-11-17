/**
 * How long a settled token account lookup is reused after it resolves.
 *
 * One generic sync reads the owner's token accounts three times: `getBalance`, the bridge's token
 * account shapes and `listOperations` (its signature sources). Each builds its own `ChainAPI`, so
 * the lookups can only be shared here, at module level. `getBalance` and the shapes run together;
 * `listOperations` starts once the balance is read. The window must cover that gap, and stay well
 * under the sync interval so the next sync reads fresh accounts.
 */
export const SHARED_TOKEN_ACCOUNTS_TTL_MS = 15_000;

type Entry = {
  promise: Promise<unknown>;
  /** `Infinity` while in flight: a pending lookup is always shared. */
  expiresAt: number;
};

const entries = new Map<string, Entry>();

function prune(now: number): void {
  for (const [key, entry] of entries) {
    if (entry.expiresAt <= now) entries.delete(key);
  }
}

/**
 * Shares one token account lookup per `endpoint`, token program and owner: callers in flight get
 * the same promise, and a resolved lookup is reused for {@link SHARED_TOKEN_ACCOUNTS_TTL_MS}. A
 * rejected lookup is not kept, so the next caller retries.
 */
export function sharedTokenAccounts<T>(
  endpoint: string,
  programId: string,
  owner: string,
  fetch: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  prune(now);

  const key = `${endpoint}|${programId}|${owner}`;
  const cached = entries.get(key);
  if (cached) return cached.promise as Promise<T>;

  const entry: Entry = { promise: Promise.resolve(), expiresAt: Infinity };
  entry.promise = fetch().then(
    value => {
      if (entries.get(key) === entry) entry.expiresAt = Date.now() + SHARED_TOKEN_ACCOUNTS_TTL_MS;
      return value;
    },
    (error: unknown) => {
      if (entries.get(key) === entry) entries.delete(key);
      throw error;
    },
  );
  entries.set(key, entry);
  return entry.promise as Promise<T>;
}

/**
 * Drops every shared lookup. Called on broadcast: a sent transaction can open or close a token
 * account, and the sync that follows must see it.
 */
export function clearSharedTokenAccounts(): void {
  entries.clear();
}
