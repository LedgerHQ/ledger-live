import { Balance } from "@ledgerhq/coin-module-framework/api/types";
import { getDelegatedStakes, getAllBalancesCached } from "../network";
import { toStakes, toSuiAsset } from "../network/sdk";
import type { SuiCoinConfig } from "../config";

export async function getBalance(config: SuiCoinConfig, address: string): Promise<Balance[]> {
  const [native, staking] = await Promise.all([
    getNativeBalance(config, address),
    getStakingBalances(config, address),
  ]);
  return [...native, ...staking];
}

const getNativeBalance = async (config: SuiCoinConfig, address: string): Promise<Balance[]> => {
  const balances = await getAllBalancesCached(config, address);
  return balances.length
    ? balances.map(({ coinType, totalBalance }) => ({
        value: BigInt(totalBalance),
        asset: toSuiAsset(coinType),
      }))
    : [{ value: 0n, asset: { type: "native" } }];
};

const getStakingBalances = (config: SuiCoinConfig, address: string): Promise<Balance[]> =>
  getDelegatedStakes(config, address).then(delegations =>
    delegations
      .flatMap(d => toStakes(address, d))
      .map(stake => ({
        value: stake.amount,
        asset: stake.asset,
        stake: stake,
      })),
  );
