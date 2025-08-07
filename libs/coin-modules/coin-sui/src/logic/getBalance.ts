import { getAccount, getStakes } from "../network";
import { Balance } from "@ledgerhq/coin-framework/api/types";

export async function getBalance(address: string): Promise<Balance[]> {
  const [native, staking] = await Promise.all([
    getNativeBalance(address),
    getStakingBalances(address),
  ]);
  return [native].concat(staking);
}

const getNativeBalance = (address: string): Promise<Balance> =>
  getAccount(address).then(account => ({
    value: BigInt(account.balance.toString()),
    asset: { type: "native" },
  }));

const getStakingBalances = (address: string): Promise<Balance[]> =>
  getStakes(address).then(stakes =>
    stakes.map(stake => ({
      value: stake.amount,
      asset: stake.asset,
      stake: stake,
    })),
  );
