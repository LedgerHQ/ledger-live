import { Balance } from "@ledgerhq/coin-module-framework/api/index";
import { CosmosAPI } from "../../network/Cosmos";
import { buildStakes } from "../staking/toStakes";

/**
 * Native balance plus one stake-carrying balance per delegation/unbonding. `value` = liquid +
 * staked/unbonding principal; `locked` = that principal, so spendable = liquid.
 */
export async function getBalance(api: CosmosAPI, address: string): Promise<Balance[]> {
  const currency = api.getCurrency();
  const [liquid, positions] = await Promise.all([
    api.getAllBalances(address, currency),
    api.getStakingPositions(address, currency),
  ]);

  const stakes = buildStakes(address, positions);
  const locked = stakes.reduce((acc, s) => acc + s.amount, 0n);

  const native: Balance = {
    value: BigInt(liquid.toFixed()) + locked,
    asset: { type: "native" },
    locked,
  };
  const stakeBalances: Balance[] = stakes.map(stake => ({
    value: stake.amount,
    asset: { type: "native" },
    stake,
  }));

  return [native, ...stakeBalances];
}
