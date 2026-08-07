import { Balance } from "@ledgerhq/coin-module-framework/api/types";
import { getDelegatedStakes, getAllBalancesCached } from "../network";
import { toStakes, toSuiAsset } from "../network/sdk";
import type { SuiCoinConfig } from "../config";

export async function getBalance(
  address: string,
  currencyId?: string,
  config?: SuiCoinConfig,
): Promise<Balance[]> {
  const [native, staking] = await Promise.all([
    getNativeBalance(address, currencyId, config),
    getStakingBalances(address, currencyId, config),
  ]);
  return [...native, ...staking];
}

const getNativeBalance = async (
  address: string,
  currencyId?: string,
  config?: SuiCoinConfig,
): Promise<Balance[]> => {
  const balances = await getAllBalancesCached(address, currencyId, config);
  return balances.length
    ? balances.map(({ coinType, totalBalance }) => ({
        value: BigInt(totalBalance),
        asset: toSuiAsset(coinType),
      }))
    : [{ value: 0n, asset: { type: "native" } }];
};

const getStakingBalances = (
  address: string,
  currencyId?: string,
  config?: SuiCoinConfig,
): Promise<Balance[]> =>
  getDelegatedStakes(address, currencyId, config).then(delegations =>
    delegations
      .flatMap(d => toStakes(address, d))
      .map(stake => ({
        value: stake.amount,
        asset: stake.asset,
        stake: stake,
      })),
  );
