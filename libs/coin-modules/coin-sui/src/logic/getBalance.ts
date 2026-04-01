import { Balance } from "@ledgerhq/coin-framework/api/types";
import { getStakes, getAllBalancesCached } from "../network";
import { toSuiAsset } from "../network/sdk";

export async function getBalance(address: string, currencyId?: string): Promise<Balance[]> {
  const [native, staking] = await Promise.all([
    getNativeBalance(address, currencyId),
    getStakingBalances(address, currencyId),
  ]);
  return [...native, ...staking];
}

const getNativeBalance = async (address: string, currencyId?: string): Promise<Balance[]> => {
  const balances = await getAllBalancesCached(address, currencyId);
  return balances.length
    ? balances.map(({ coinType, totalBalance }) => ({
        value: BigInt(totalBalance),
        asset: toSuiAsset(coinType),
      }))
    : [{ value: 0n, asset: { type: "native" } }];
};

const getStakingBalances = (address: string, currencyId?: string): Promise<Balance[]> =>
  getStakes(address, currencyId).then(stakes =>
    stakes.map(stake => ({
      value: stake.amount,
      asset: stake.asset,
      stake: stake,
    })),
  );
