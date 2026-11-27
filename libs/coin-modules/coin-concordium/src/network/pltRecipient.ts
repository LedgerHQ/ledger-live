import { makeLRUCache, type CacheRes } from "@ledgerhq/live-network/cache";
import { positiveInt } from "../tuning";
import {
  withConfig,
  type ConcordiumCoinConfig,
  type ConcordiumContext,
  type PltAccountToken,
  type PltModuleState,
} from "../types";
import { readAccountTokens, readPltState } from "./plt";
import { getAccountBalance, getPltTokenInfo } from "./proxyClient";

type TokenQuery = { context: ConcordiumContext; tokenId: string };
type AccountQuery = { context: ConcordiumContext; address: string };
type Resolved<Q> = Q & { config: ConcordiumCoinConfig };

/**
 * One LRU cache per configured TTL, keyed by endpoint so no proxy answers for another.
 * The context only resolves the configuration and never enters the cache key.
 */
function makeTtlCache<Q extends { context: ConcordiumContext }, R>(
  fetch: (query: Resolved<Q>) => Promise<R>,
  keyOf: (query: Q) => string,
  ttlMsOf: (config: ConcordiumCoinConfig) => number,
): (query: Q) => Promise<R> {
  const caches = new Map<number, CacheRes<[Resolved<Q>], R>>();
  return async query => {
    const config = await query.context.config();
    const ttl = ttlMsOf(config);
    let cache = caches.get(ttl);
    if (!cache) {
      cache = makeLRUCache(fetch, q => `${q.config.proxyUrl}:${keyOf(q)}`, {
        max: 100,
        ttl,
      });
      caches.set(ttl, cache);
    }
    return cache({ ...query, config });
  };
}

/**
 * What the recipient's balance response turned out to be.
 *
 * Three outcomes, not two: an account that does not exist, one whose token list
 * was read, and a response that could not be read at all. Collapsing the third
 * into an empty list is what makes a deny-list token read as allowed.
 */
export type RecipientTokens =
  | { status: "absent" }
  | { status: "unreadable" }
  | { status: "readable"; entries: PltAccountToken[] };

/**
 * The token's own module state, which says whether it enforces either list.
 *
 * Cached per token rather than per account, because that is what it describes:
 * one read answers for every recipient the user tries, and the answer decides
 * whether a recipient read is needed at all.
 *
 * Deliberately not taken from the sender's synced entry, which carries the same
 * blob. `ConcordiumTokenResources` persists only the folded verdict and the
 * pause flag, so the list flags are not there to read, and the entry they came
 * from is not kept.
 *
 * Held longer than {@link fetchAccountTokens}, and safely so: CIS-7 takes
 * `allowList` and `denyList` as initialization parameters and defines no
 * operation that toggles them, so this half of the check cannot go stale. Only
 * membership is mutable, and that is the other read.
 *
 * The same blob also carries `paused`, which *is* mutable — do not read it from
 * here. The pause check belongs to the sender and comes from synced resources.
 */
export const fetchPltModuleState = makeTtlCache(
  async ({
    context,
    config,
    tokenId,
  }: Resolved<TokenQuery>): Promise<PltModuleState | undefined> => {
    const info = await getPltTokenInfo(withConfig(context, config), tokenId);
    return readPltState(info?.tokenState?.moduleState);
  },
  ({ tokenId }) => tokenId,
  config =>
    positiveInt("gateway.pltModuleStateCacheTtlMs", config.gateway?.pltModuleStateCacheTtlMs),
);

/**
 * What one account holds, and whether it exists at all.
 *
 * `exists` is not derivable from an empty list: an address that was never
 * created is a different fact from one that holds no tokens, and a different
 * message to the user.
 *
 * Keyed on the address alone, not on the token: one response carries every
 * token the account holds, so a per-token key would refetch the same body once
 * per token. The default of thirty seconds matches the equivalent Hedera lookup, and the cache
 * drops a rejected entry rather than storing the failure, so a transient proxy
 * error is retried on the next keystroke instead of being pinned for the TTL.
 * The TTL is what bounds staleness of the one mutable half of the check: list
 * *membership* changes under the user, where the token's list configuration
 * cannot (CIS-7 fixes both flags at creation).
 */
export const fetchAccountTokens = makeTtlCache(
  async ({ context, config, address }: Resolved<AccountQuery>): Promise<RecipientTokens> => {
    const { finalizedBalance } = await getAccountBalance(withConfig(context, config), address);
    if (!finalizedBalance) return { status: "absent" };

    const entries = readAccountTokens(finalizedBalance.accountTokens);
    return entries ? { status: "readable", entries } : { status: "unreadable" };
  },
  ({ address }) => address,
  config => positiveInt("gateway.accountTokensCacheTtlMs", config.gateway?.accountTokensCacheTtlMs),
);
