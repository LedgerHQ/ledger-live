import network from "@ledgerhq/live-network";
import type { StakingValidatorItem } from "../types/staking";

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

export const getValidators = async (
  currencyId: string,
  apiConfig?: { baseUrl: string; validatorsEndpoint: string },
): Promise<StakingValidatorItem[]> => {
  const api = getValidatorApi(currencyId);
  return api && apiConfig ? api.fetchValidators(apiConfig) : [];
};
