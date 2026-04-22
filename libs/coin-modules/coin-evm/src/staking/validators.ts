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

export const getValidators = async (
  currencyId: string,
  apiConfig?: { baseUrl: string; validatorsEndpoint: string },
): Promise<StakingValidatorItem[]> => {
  const api = getValidatorApi(currencyId);
  const config = apiConfig ?? STAKING_CONTRACTS[currencyId]?.apiConfig;
  return api && config ? api.fetchValidators(config) : [];
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
