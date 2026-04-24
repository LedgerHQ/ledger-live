import network from "@ledgerhq/live-network";
import type { Page, Validator } from "@ledgerhq/coin-module-framework/api/index";
import type { StakingValidatorItem } from "../types/staking";
import { STAKING_CONTRACTS } from "./contracts";

export type ValidatorApi = {
  fetchValidators: (config: {
    baseUrl: string;
    validatorsEndpoint: string;
  }) => Promise<StakingValidatorItem[]>;
};

type CosmosValidatorDescription = {
  moniker: string;
};

type CosmosValidatorCommission = {
  commission_rates: {
    rate: string;
  };
};

type CosmosValidator = {
  operator_address: string;
  description: CosmosValidatorDescription;
  commission: CosmosValidatorCommission;
  tokens: string;
};

type CacheEntry = {
  data: StakingValidatorItem[];
  fetchedAt: number;
};

/**
 * In-memory validators cache. Same TTL as Cosmos preload (30s) so that
 * a user navigating across delegation screens reads a hot cache instead of
 * paying a network roundtrip each time. It is intentionally simple: no CurrencyBridge.preload / hydrate
 * contract
 */
const CACHE_MAX_AGE_MS = 30 * 1000;

type CosmosValidatorsResponse = { validators: CosmosValidator[] };

const seiValidatorApi: ValidatorApi = {
  fetchValidators: async config => {
    const { baseUrl, validatorsEndpoint } = config;
    if (!baseUrl) return [];

    try {
      const { data } = await network<CosmosValidatorsResponse>({
        url: `${baseUrl}${validatorsEndpoint}`,
        method: "GET",
      });

      return Array.isArray(data?.validators)
        ? data.validators
            .filter((v): v is CosmosValidator => typeof v?.operator_address === "string")
            .map(
              (v, index): StakingValidatorItem => ({
                validatorAddress: v.operator_address,
                name: v.description?.moniker ?? v.operator_address,
                commission: Number.parseFloat(v.commission?.commission_rates?.rate ?? "0"),
                tokens: Number.parseFloat(v.tokens ?? "0"),
                votingPower: index,
                estimatedYearlyRewardsRate: 0,
              }),
            )
        : [];
    } catch (error) {
      console.error("Failed to fetch SEI validators", {
        error: error instanceof Error ? error.message : String(error),
        baseUrl,
      });
      return [];
    }
  },
};

export const getValidatorApi = (currencyId: string): ValidatorApi | undefined => {
  switch (currencyId) {
    case "sei_evm":
      return seiValidatorApi;
    default:
      return undefined;
  }
};

const toValidatorBalance = (tokens: number): bigint => {
  if (!Number.isFinite(tokens) || tokens <= 0) return 0n;
  return BigInt(Math.floor(tokens));
};

const validatorsCache: Map<string, CacheEntry> = new Map();
// Deduplicates concurrent fetches for the same currency (Info modal + Delegate
// modal opening in quick succession).
const inFlightFetches: Map<string, Promise<StakingValidatorItem[]>> = new Map();

const isFresh = (entry: CacheEntry | undefined): entry is CacheEntry =>
  !!entry && Date.now() - entry.fetchedAt <= CACHE_MAX_AGE_MS;

/**
 * Returns cached validators synchronously when fresh, or `undefined` when the
 * cache is empty/stale. Used to seed React state so the UI does not show an
 * empty list while a background refresh is in flight.
 */
export const getCachedValidators = (currencyId: string): StakingValidatorItem[] | undefined => {
  const entry = validatorsCache.get(currencyId);
  return isFresh(entry) ? entry.data : undefined;
};

export const clearValidatorsCache = (currencyId?: string): void => {
  if (currencyId) {
    validatorsCache.delete(currencyId);
    inFlightFetches.delete(currencyId);
  } else {
    validatorsCache.clear();
    inFlightFetches.clear();
  }
};

export const getValidators = async (
  currencyId: string,
  apiConfig?: { baseUrl: string; validatorsEndpoint: string },
): Promise<StakingValidatorItem[]> => {
  // Explicit apiConfig bypasses the cache (callers opt out on purpose, e.g. tests).
  if (!apiConfig) {
    const cached = getCachedValidators(currencyId);
    if (cached) return cached;

    const inFlight = inFlightFetches.get(currencyId);
    if (inFlight) return inFlight;
  }

  const api = getValidatorApi(currencyId);
  const config = apiConfig ?? STAKING_CONTRACTS[currencyId]?.apiConfig;
  if (!api || !config) return [];

  const request = api
    .fetchValidators(config)
    .then(data => {
      if (!apiConfig && data.length > 0) {
        validatorsCache.set(currencyId, { data, fetchedAt: Date.now() });
      }
      return data;
    })
    .finally(() => {
      if (!apiConfig) inFlightFetches.delete(currencyId);
    });

  if (!apiConfig) inFlightFetches.set(currencyId, request);
  return request;
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

export const hasUnbondingPeriod = (currencyId: string): boolean => {
  const days = getUnbondingPeriodDays(currencyId);
  return typeof days === "number" && days > 0;
};

export const getValidatorsPage = async (currencyId: string): Promise<Page<Validator>> => {
  const items = await getValidators(currencyId);
  return {
    items: items.map(v => ({
      address: v.validatorAddress,
      name: v.name,
      balance: toValidatorBalance(v.tokens),
      commissionRate: v.commission.toString(),
      apy: v.estimatedYearlyRewardsRate,
    })),
    next: undefined,
  };
};
