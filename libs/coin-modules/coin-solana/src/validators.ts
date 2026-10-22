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

export async function fetchValidators(
  config: SolanaCoinConfig,
  currencyId: string,
): Promise<ValidatorsAppValidator[]> {
  const cluster = clusterByCurrencyId(currencyId);

  if (cluster === "devnet") {
    return fetchDevnetValidators(getChainAPI(chainConfigFrom(config, currencyId)));
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

type ValidatorsCache = CacheRes<
  [config: SolanaCoinConfig, currencyId: string],
  ValidatorsAppValidator[]
>;

// The LRU TTL is fixed at creation, so the TTL read from the config picks its own cache.
const cachesByTtl = new Map<number, ValidatorsCache>();
const keysByCurrency = new Map<string, Set<string>>();

// Everything the fetched list depends on, so a context with another config never gets this result.
function cacheKeyOf(config: SolanaCoinConfig, currencyId: string): string {
  const rpcUrls: Partial<Record<string, string>> = config.rpcUrls ?? {};
  return JSON.stringify([
    currencyId,
    rpcUrls[currencyId],
    config.validatorsUrl,
    config.staking?.validatorsSummaryUrl,
    config.staking?.ledgerValidators,
  ]);
}

function cacheOf(config: SolanaCoinConfig): ValidatorsCache {
  const ttl = config.validators?.cacheTtlMs ?? DEFAULT_VALIDATORS_CACHE_TTL_MS;
  let cache = cachesByTtl.get(ttl);
  if (!cache) {
    cache = makeLRUCache(fetchValidators, cacheKeyOf, { max: VALIDATORS_CACHE_MAX, ttl });
    cachesByTtl.set(ttl, cache);
  }
  return cache;
}

export const getSolanaValidators = Object.assign(
  async (context: SolanaContext, currencyId: string): Promise<ValidatorsAppValidator[]> => {
    const config = await context.config();
    const keys = keysByCurrency.get(currencyId) ?? new Set<string>();
    keys.add(cacheKeyOf(config, currencyId));
    keysByCurrency.set(currencyId, keys);
    return cacheOf(config)(config, currencyId);
  },
  {
    clear: (currencyId: string) => {
      const keys = keysByCurrency.get(currencyId) ?? new Set<string>();
      cachesByTtl.forEach(cache => keys.forEach(key => cache.clear(key)));
      keysByCurrency.delete(currencyId);
    },
    reset: () => {
      cachesByTtl.forEach(cache => cache.reset());
      keysByCurrency.clear();
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
