import { getStakes, getAllBalancesCached } from "../network";
import { Balance } from "@ledgerhq/coin-framework/api/types";
import { toSuiAsset } from "../network/sdk";

export async function getBalance(address: string): Promise<Balance[]> {
  const [native, staking] = await Promise.all([
    getNativeAndTokensBalance(address),
    getStakingBalances(address),
  ]);
  return [...native, ...staking];
}

const getNativeAndTokensBalance = async (address: string): Promise<Balance[]> => {
  const balances = await getAllBalancesCached(address);
  return balances.map(({ coinType, totalBalance }) => ({
    value: BigInt(totalBalance),
    asset: toSuiAsset(coinType),
  }));
};

const getStakingBalances = (address: string): Promise<Balance[]> =>
  getStakes(address).then(stakes =>
    stakes.map(stake => ({
      value: stake.amount,
      asset: stake.asset,
      stake: stake,
    })),
  );
