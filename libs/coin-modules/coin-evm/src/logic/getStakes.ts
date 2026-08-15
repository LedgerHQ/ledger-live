import { Page, Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { EvmContext } from "../config";
import { STAKING_CONTRACTS, STAKING_CONFIG } from "../staking";

export const getStakes = async (
  context: EvmContext,
  currencyId: string,
  address: string,
): Promise<Page<Stake>> => {
  const contractConfig = STAKING_CONTRACTS[currencyId];

  if (!contractConfig) {
    return { items: [] };
  }

  try {
    const config = await context.config(currencyId);
    const stakingStrategy = STAKING_CONFIG[currencyId];
    const stakes =
      (await stakingStrategy?.fetcher(config, address, contractConfig, currencyId)) || [];
    return { items: stakes };
  } catch {
    return { items: [] };
  }
};
