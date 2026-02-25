import { Balance } from "@ledgerhq/coin-framework/api/types";
import { getStakes, getAllBalancesCached } from "../network";
import { toSuiAsset } from "../network/sdk";

export async function getBalance(address: string): Promise<Balance[]> {
  const [native, staking] = await Promise.all([
    getNativeBalance(address),
    getStakingBalances(address),
  ]);
  return [...native, ...staking];
}

const getNativeBalance = async (address: string): Promise<Balance[]> => {
  const balances = await getAllBalancesCached(address);
  return balances.length
    ? balances.map(({ coinType, totalBalance }) => ({
        value: BigInt(totalBalance),
        asset: toSuiAsset(coinType),
      }))
    : [{ value: 0n, asset: { type: "native" } }];
};

const getStakingBalances = (address: string): Promise<Balance[]> =>
  getStakes(address).then(stakes =>
    stakes.map(stake => ({
      value: stake.amount,
      asset: stake.asset,
      stake: stake,
    })),
  );
