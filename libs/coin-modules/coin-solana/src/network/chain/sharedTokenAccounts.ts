import { makeLRUCache } from "@ledgerhq/live-network/cache";

/**
 * How long a token account lookup is shared, counted from when it starts.
 *
 * One generic sync reads the owner's token accounts three times: `getBalance`, the bridge's token
 * account shapes and `listOperations` (its signature sources). Each builds its own `ChainAPI`, so
 * the lookups can only be shared here, at module level. `getBalance` and the shapes run together;
 * `listOperations` starts once the balance is read. The window must cover that gap, and stay well
 * under the sync interval so the next sync reads fresh accounts. It also bounds how long a lookup
 * that never settles is handed out.
 */
export const SHARED_TOKEN_ACCOUNTS_TTL_MS = 15_000;

/**
 * How many lookups (endpoint, token program, owner) are kept at most; the least recently used one
 * is evicted first. A wallet syncs a few owners at a time, but the module also runs server side
 * (coin-service), where one process serves many owners: without a bound, every owner read in the
 * last window would stay in memory, with its whole token account list.
 */
export const SHARED_TOKEN_ACCOUNTS_MAX = 256;

const lookups = makeLRUCache(
  (_endpoint: string, _programId: string, _owner: string, fetch: () => Promise<unknown>) => fetch(),
  (endpoint, programId, owner) => `${endpoint}|${programId}|${owner}`,
  { max: SHARED_TOKEN_ACCOUNTS_MAX, ttl: SHARED_TOKEN_ACCOUNTS_TTL_MS },
);

/**
 * Shares one token account lookup per `endpoint`, token program and owner: callers get the same
 * promise for {@link SHARED_TOKEN_ACCOUNTS_TTL_MS}, in flight or resolved. A rejected lookup is not
 * kept, so the next caller retries. At most {@link SHARED_TOKEN_ACCOUNTS_MAX} lookups are kept.
 */
export function sharedTokenAccounts<T>(
  endpoint: string,
  programId: string,
  owner: string,
  fetch: () => Promise<T>,
): Promise<T> {
  return lookups(endpoint, programId, owner, fetch) as Promise<T>;
}

/**
 * Drops every shared lookup. Called on broadcast: a sent transaction can open or close a token
 * account, and the sync that follows must see it.
 */
export function clearSharedTokenAccounts(): void {
  lookups.reset();
}
