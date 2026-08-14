import { Page, Stake } from "@ledgerhq/coin-module-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { EvmContext } from "../config";
import { STAKING_CONTRACTS, STAKING_CONFIG } from "../staking";

export const getStakes = async (
  context: EvmContext,
  currency: CryptoCurrency,
  address: string,
): Promise<Page<Stake>> => {
  const contractConfig = STAKING_CONTRACTS[currency.id];

  if (!contractConfig) {
    return { items: [] };
  }

  try {
    const config = await context.config(currency.id);
    const stakingStrategy = STAKING_CONFIG[currency.id];
    const stakes =
      (await stakingStrategy?.fetcher(config, address, contractConfig, currency)) || [];
    return { items: stakes };
  } catch {
    return { items: [] };
  }
};
