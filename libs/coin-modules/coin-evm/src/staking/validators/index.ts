import type { Cursor, Page, Validator } from "@ledgerhq/coin-module-framework/api/index";
import type { StakingValidatorItem } from "@ledgerhq/types-live";
import { STAKING_CONTRACTS } from "../contracts";
import monadValidatorApi from "./monad";
import seiValidatorApi from "./sei";
import type { ValidatorApi } from "./types";

const toFrameworkValidator = (validator: StakingValidatorItem): Validator => ({
  address: validator.validatorAddress,
  name: validator.name,
  balance:
    Number.isFinite(validator.tokens) && validator.tokens > 0
      ? BigInt(Math.floor(validator.tokens))
      : 0n,
  commissionRate: validator.commission.toString(),
  apy: validator.estimatedYearlyRewardsRate,
});

type CacheEntry = {
  data: Page<StakingValidatorItem>;
  fetchedAt: number;
};

/**
 * In-memory validators cache. Same TTL as Cosmos preload (30s) so that
 * a user navigating across delegation screens reads a hot cache instead of
 * paying a network roundtrip each time. It is intentionally simple: no CurrencyBridge.preload / hydrate
 * contract
 */
const CACHE_MAX_AGE_MS = 30 * 1000;

const getValidatorApi = (currencyId: string): ValidatorApi | undefined => {
  switch (currencyId) {
    case "sei_evm":
      return seiValidatorApi;
    case "monad":
      return monadValidatorApi;
    default:
      return undefined;
  }
};

const pageKey = (currencyId: string, cursor?: Cursor): string => `${currencyId}-${cursor ?? ""}`;

const validatorsCache: Map<string, CacheEntry> = new Map();

const isFresh = (entry: CacheEntry | undefined): entry is CacheEntry =>
  !!entry && Date.now() - entry.fetchedAt <= CACHE_MAX_AGE_MS;

/**
 * Returns cached validators synchronously when fresh, or `undefined` when the
 * cache is empty/stale. Used to seed React state so the UI does not show an
 * empty list while a background refresh is in flight.
 */
export const getCachedValidators = (
  currencyId: string,
  cursor?: Cursor,
): Page<StakingValidatorItem> | undefined => {
  const entry = validatorsCache.get(pageKey(currencyId, cursor));

  return isFresh(entry) ? entry.data : undefined;
};

export const clearValidatorsCache = (currencyId?: string): void => {
  if (currencyId) {
    for (const key of validatorsCache.keys()) {
      if (key.startsWith(`${currencyId}-`)) validatorsCache.delete(key);
    }
  } else {
    validatorsCache.clear();
  }
};

export const getValidators = async (
  currencyId: string,
  cursor?: Cursor,
): Promise<Page<StakingValidatorItem>> => {
  const cached = getCachedValidators(currencyId, cursor);
  if (cached) return cached;

  const api = getValidatorApi(currencyId);
  if (!api) return { items: [], next: undefined };

  const page = await api.fetchValidators(currencyId, cursor);
  if (page.items.length > 0) {
    validatorsCache.set(pageKey(currencyId, cursor), {
      data: page,
      fetchedAt: Date.now(),
    });
  }

  return page;
};

/**
 * Fire-and-forget warm-up of the validators cache. Called before the user
 * reaches the validator selection step so the list appears instantly.
 */
export const prefetchValidators = (currencyId: string): void => {
  if (getCachedValidators(currencyId)) return;
  void getValidators(currencyId).catch(() => {
    /* swallow: the hook surfaces errors via its own flow */
  });
};

export const getValidatorExplorerUrl = (currencyId: string, address: string): string | undefined =>
  STAKING_CONTRACTS[currencyId]?.explorerConfig?.validatorUrl?.replace("$address", address);

export const getUnbondingPeriodDays = (currencyId: string): number | undefined =>
  STAKING_CONTRACTS[currencyId]?.unbondingPeriodDays;

export const getMaxRedelegations = (currencyId: string): number | undefined =>
  STAKING_CONTRACTS[currencyId]?.maxRedelegations;

export const hasUnbondingPeriod = (currencyId: string): boolean => {
  const days = getUnbondingPeriodDays(currencyId);
  return typeof days === "number" && days > 0;
};

export const getFrameworkValidators = async (
  currencyId: string,
  cursor?: Cursor,
): Promise<Page<Validator>> => {
  const page = await getValidators(currencyId, cursor);

  return { items: page.items.map(toFrameworkValidator), next: page.next };
};
