import { Page, Stake } from "@ledgerhq/coin-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { STAKING_CONTRACTS, STAKING_CONFIG } from "../staking";

export const getStakes = async (
  currency: CryptoCurrency,
  address: string,
): Promise<Page<Stake>> => {
  const contractConfig = STAKING_CONTRACTS[currency.id];

  if (!contractConfig) {
    return { items: [] };
  }

  try {
    const stakingStrategy = STAKING_CONFIG[currency.id];
    const stakes = (await stakingStrategy?.fetcher(address, contractConfig, currency)) || [];
    return { items: stakes };
  } catch {
    return { items: [] };
  }
};
