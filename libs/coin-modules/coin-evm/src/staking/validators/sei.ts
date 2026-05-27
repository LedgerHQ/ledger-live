import network from "@ledgerhq/live-network";
import type { Page } from "@ledgerhq/coin-module-framework/api/index";
import { log } from "@ledgerhq/logs";
import type { StakingValidatorItem } from "@ledgerhq/types-live";
import { STAKING_CONTRACTS } from "../contracts";
import type { ValidatorApi } from "./types";

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

export default {
  fetchValidators: async (currencyId): Promise<Page<StakingValidatorItem>> => {
    const apiConfig = STAKING_CONTRACTS[currencyId]?.apiConfig;
    if (!apiConfig?.baseUrl) return { items: [], next: undefined };

    const { baseUrl, validatorsEndpoint } = apiConfig;

    try {
      const { data } = await network<CosmosValidatorsResponse>({
        url: `${baseUrl}${validatorsEndpoint}`,
        method: "GET",
      });

      const items: StakingValidatorItem[] = Array.isArray(data?.validators)
        ? data.validators
            .filter((v): v is CosmosValidator => typeof v?.operator_address === "string")
            .map((v, index) => ({
              validatorAddress: v.operator_address,
              name: v.description?.moniker ?? v.operator_address,
              commission: Number.parseFloat(v.commission?.commission_rates?.rate ?? "0"),
              tokens: Number.parseFloat(v.tokens ?? "0"),
              votingPower: index,
              estimatedYearlyRewardsRate: 0,
            }))
        : [];

      return { items, next: undefined };
    } catch (error) {
      log("coin-evm/staking", "fetchValidators: SEI validators fetch failed", {
        error: error instanceof Error ? error.message : String(error),
        baseUrl,
      });
      return { items: [], next: undefined };
    }
  },
} satisfies ValidatorApi;
