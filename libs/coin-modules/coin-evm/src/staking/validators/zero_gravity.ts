import { ethers } from "ethers";
import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import type { Page } from "@ledgerhq/coin-module-framework/api/index";
import type { StakingValidatorItem } from "@ledgerhq/types-live";
import { STAKING_CONTRACTS } from "../contracts";
import type { ValidatorApi } from "./types";

type ExploreMe0gValidator = {
  addr: string;
  moniker: string | null;
  commission_pct: string;
  voting_power_tokens: string;
};

function isExploreMe0gValidator(value: unknown): value is ExploreMe0gValidator {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "addr" in value &&
    typeof value.addr === "string" &&
    "moniker" in value &&
    (value.moniker === null || typeof value.moniker === "string") &&
    "commission_pct" in value &&
    typeof value.commission_pct === "string" &&
    "voting_power_tokens" in value &&
    typeof value.voting_power_tokens === "string"
  );
}

const zeroGravityValidatorApi: ValidatorApi = {
  fetchValidators: async (currencyId): Promise<Page<StakingValidatorItem>> => {
    const apiConfig = STAKING_CONTRACTS[currencyId]?.apiConfig;
    if (!apiConfig?.baseUrl) return { items: [], next: undefined };

    const { baseUrl, validatorsEndpoint } = apiConfig;

    try {
      const { data } = await network({
        url: `${baseUrl}${validatorsEndpoint}`,
        method: "GET",
      });

      const items: StakingValidatorItem[] = Array.isArray(data)
        ? data.filter(isExploreMe0gValidator).map((v, index) => {
            const validatorAddress = ethers.getAddress("0x" + v.addr);
            return {
              validatorAddress,
              name: v.moniker ?? validatorAddress,
              commission: parseFloat(v.commission_pct) / 100,
              tokens: v.voting_power_tokens,
              votingPower: index,
              estimatedYearlyRewardsRate: 0,
            };
          })
        : [];

      return { items, next: undefined };
    } catch (error) {
      log("coin-evm/staking", "fetchValidators: 0G validators fetch failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { items: [], next: undefined };
    }
  },
};

export default zeroGravityValidatorApi;
