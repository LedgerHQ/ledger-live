import BigNumber from "bignumber.js";
import { AptosAPI } from "../network";
import { GetCurrentDelegatorBalancesData } from "./graphql/queries";
import { CurrentDelegatorBalance, GetCurrentDelegatorBalancesQuery } from "./graphql/types";
import { AptosValidator } from "../types";
import { isTestnet } from "../logic/isTestnet";
import { APTOS_EXPLORER_ACCOUNT_URL } from "../constants";
import { formatUnlockTime } from "../logic/staking";

export async function getValidators(currencyId: string): Promise<AptosValidator[]> {
  const api = new AptosAPI(currencyId);
  const query = GetCurrentDelegatorBalancesData;
  const queryResponse = await api.apolloClient.query<GetCurrentDelegatorBalancesQuery, object>({
    query: query,
    fetchPolicy: "network-only",
  });

  const stakingData: CurrentDelegatorBalance[] = queryResponse.data.current_delegator_balances;

  const list: AptosValidator[] = await Promise.all(
    stakingData.map(async pool => {
      const aptosName = pool.staking_pool_metadata.operator_aptos_name;
      const naming =
        Array.isArray(aptosName) && aptosName.length > 0 && aptosName[0].domain_with_suffix
          ? aptosName[0].domain_with_suffix
          : pool.current_pool_balance.staking_pool_address;

      const url = `${APTOS_EXPLORER_ACCOUNT_URL}/${pool.current_pool_balance.staking_pool_address}?network=${isTestnet(currencyId) ? "testnet" : "mainnet"}`;

      const unblockdata = await api.getNextUnlockTime(
        pool.current_pool_balance.staking_pool_address,
      );
      const nextUnlockTime = unblockdata ? formatUnlockTime(unblockdata) : undefined; //`${30}d ${20}h ${30}m`;

      return {
        commission: BigNumber(pool.current_pool_balance.operator_commission_percentage).div(100),
        activeStake: BigNumber(pool.current_pool_balance.total_coins),
        address: pool.current_pool_balance.staking_pool_address,
        name: naming,
        shares: pool.current_pool_balance.total_shares,
        wwwUrl: url,
        nextUnlockTime: nextUnlockTime,
      };
    }),
  );

  return list.sort((a, b) => b.activeStake.toNumber() - a.activeStake.toNumber());
}
