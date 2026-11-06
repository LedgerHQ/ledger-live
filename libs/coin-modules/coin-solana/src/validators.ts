import { makeLRUCache } from "@ledgerhq/live-network/cache";
import type { CacheRes } from "@ledgerhq/live-network/cache";
import { flow } from "lodash/fp";
import { getChainAPI } from "./network";
import type { ChainAPI } from "./network";
import { getValidators } from "./network/validator-app";
import type { ValidatorsAppValidator } from "./network/validator-app";
import {
  clusterByCurrencyId,
  chainConfigFrom,
  ledgerFirstValidators,
  ledgerValidatorsOf,
  profitableValidators,
} from "./utils";
import type { SolanaCoinConfig, SolanaContext } from "./config";
import { DEFAULT_VALIDATORS_CACHE_TTL_MS } from "./constants";

// one entry per solana currency id
const VALIDATORS_CACHE_MAX = 3;
const TTL_CACHES_MAX = 3;

export async function fetchValidators(
  config: SolanaCoinConfig,
  currencyId: string,
): Promise<ValidatorsAppValidator[]> {
  const cluster = clusterByCurrencyId(currencyId);

  if (cluster === "devnet") {
    return fetchDevnetValidators(getChainAPI(chainConfigFrom(config)));
  }

  if (!config.validatorsUrl) {
    throw Error(`no validatorsUrl in the coin config of ${currencyId}`);
  }

  const validators = await getValidators(
    config.validatorsUrl,
    config.staking?.validatorsSummaryUrl,
  );

  return cluster === "mainnet-beta"
    ? flow(
        () => validators,
        profitableValidators,
        vs => ledgerFirstValidators(vs, ledgerValidatorsOf(config)),
      )()
    : validators;
}

type ValidatorsCache = {
  fetch: CacheRes<[config: SolanaCoinConfig, currencyId: string], ValidatorsAppValidator[]>;
  currencyByKey: Map<string, string>;
};

// The LRU TTL is fixed at creation, so the TTL read from the config picks its own cache.
const cachesByTtl = new Map<number, ValidatorsCache>();

// Everything the fetched list depends on, so a context with another config never gets this result.
function cacheKeyOf(config: SolanaCoinConfig, currencyId: string): string {
  return JSON.stringify([
    currencyId,
    config.rpcUrl,
    config.validatorsUrl,
    config.staking?.validatorsSummaryUrl,
    config.staking?.ledgerValidators,
  ]);
}

// Map keeps insertion order, so re-inserting on use leaves the least recently used first.
function setMostRecent<K, V>(map: Map<K, V>, key: K, value: V, max: number): [K, V] | undefined {
  map.delete(key);
  map.set(key, value);
  if (map.size <= max) return undefined;
  const leastRecent = map.entries().next().value!;
  map.delete(leastRecent[0]);
  return leastRecent;
}

function cacheOf(config: SolanaCoinConfig): ValidatorsCache {
  const ttl = config.validators?.cacheTtlMs ?? DEFAULT_VALIDATORS_CACHE_TTL_MS;
  const cache = cachesByTtl.get(ttl) ?? {
    fetch: makeLRUCache(fetchValidators, cacheKeyOf, { max: VALIDATORS_CACHE_MAX, ttl }),
    currencyByKey: new Map<string, string>(),
  };
  setMostRecent(cachesByTtl, ttl, cache, TTL_CACHES_MAX)?.[1].fetch.reset();
  return cache;
}

export const getSolanaValidators = Object.assign(
  async (context: SolanaContext, currencyId: string): Promise<ValidatorsAppValidator[]> => {
    const config = await context.config();
    const cache = cacheOf(config);
    const evicted = setMostRecent(
      cache.currencyByKey,
      cacheKeyOf(config, currencyId),
      currencyId,
      VALIDATORS_CACHE_MAX,
    );
    // failures leave the LRU but not this map, so their orders can diverge: drop the result too
    if (evicted) cache.fetch.clear(evicted[0]);
    return cache.fetch(config, currencyId);
  },
  {
    clear: (currencyId: string) => {
      cachesByTtl.forEach(({ fetch, currencyByKey }) =>
        currencyByKey.forEach((currency, key) => {
          if (currency !== currencyId) return;
          fetch.clear(key);
          currencyByKey.delete(key);
        }),
      );
    },
    reset: () => {
      cachesByTtl.forEach(cache => cache.fetch.reset());
      cachesByTtl.clear();
    },
  },
);

async function fetchDevnetValidators(api: ChainAPI): Promise<ValidatorsAppValidator[]> {
  const voteAccs = await api.getVoteAccounts();
  return voteAccs.current.map(acc => ({
    activeStake: acc.activatedStake,
    commission: acc.commission,
    totalScore: 0,
    voteAccount: acc.votePubkey,
  }));
}
