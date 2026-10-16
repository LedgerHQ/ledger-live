import type { CosmosCoinConfig } from "../../config";
import type { CosmosAPI } from "../../network/Cosmos";
import type { CosmosRedelegationRaw } from "../../types";
import { getRedelegations } from "../staking/getRedelegations";

/**
 * Cosmos account metadata exposed through the generic `getAccountInfo` contract (ADR-045): the
 * redelegations in progress, executed and (epoched chains) queued, which a `Stake` cannot carry since
 * a redelegation has a source and a destination validator. JSON form: amounts as decimal strings,
 * completion dates as ISO strings.
 */
export type CosmosAccountInfo = {
  type: "cosmos";
  redelegations: CosmosRedelegationRaw[];
};

export async function getAccountInfo(
  config: CosmosCoinConfig,
  api: CosmosAPI,
  currencyId: string,
  address: string,
): Promise<CosmosAccountInfo> {
  const redelegations = await getRedelegations(currencyId, config.denom, address, api);
  return {
    type: "cosmos",
    redelegations: redelegations.map(
      ({ validatorSrcAddress, validatorDstAddress, amount, completionDate }) => ({
        validatorSrcAddress,
        validatorDstAddress,
        amount: amount.toFixed(),
        completionDate: completionDate.toISOString(),
      }),
    ),
  };
}
