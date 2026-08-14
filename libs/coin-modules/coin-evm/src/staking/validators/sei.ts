import network from "@ledgerhq/live-network";
import type { Page } from "@ledgerhq/coin-module-framework/api/index";
import type { Validator } from "@ledgerhq/coin-module-framework/api/types";
import { STAKING_CONTRACTS } from "../contracts";
import { seiBalanceAmountToNativeMinUnit } from "../../utils";
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

// Sei's REST endpoint returns the whole validator set in one response, so it
// ignores the cursor and always reports `next: undefined` (single page).
const seiValidatorApi: ValidatorApi = {
  fetchValidators: async (currencyId): Promise<Page<Validator>> => {
    const apiConfig = STAKING_CONTRACTS[currencyId]?.apiConfig;
    if (!apiConfig?.baseUrl) return { items: [], next: undefined };

    const { baseUrl, validatorsEndpoint } = apiConfig;

    try {
      const { data } = await network<CosmosValidatorsResponse>({
        url: `${baseUrl}${validatorsEndpoint}`,
        method: "GET",
      });

      const items: Validator[] = Array.isArray(data?.validators)
        ? data.validators
            .filter((v): v is CosmosValidator => typeof v?.operator_address === "string")
            .map(v => ({
              id: v.operator_address,
              address: v.operator_address,
              name: v.description?.moniker ?? v.operator_address,
              commissionRate: v.commission?.commission_rates?.rate ?? "0",
              balance: seiBalanceAmountToNativeMinUnit(v.tokens, "usei"),
              apy: 0,
            }))
        : [];

      return { items, next: undefined };
    } catch (error) {
      console.error("Failed to fetch SEI validators", {
        error: error instanceof Error ? error.message : String(error),
        baseUrl,
      });
      return { items: [], next: undefined };
    }
  },
};

export default seiValidatorApi;
