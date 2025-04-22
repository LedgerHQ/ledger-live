import * as blockies from "blockies-ts";
import { AptosAPI } from "../api";
import { GetCurrentDelegatorBalancesData } from "../api/graphql/queries";
import { CurrentDelegatorBalance, GetCurrentDelegatorBalancesQuery } from "../api/graphql/types";

// const MAX_VALIDATORS_NB = 1000; // Max number of validators to fetch

export type ValidatorRaw = {
  active_stake?: number | null;
  commission?: number | null;
  total_score?: number | null;
  account_addr?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  delinquent?: boolean | null;
  www_url?: string | null;
};

export type Validator = {
  activeStake: number;
  commission: number;
  totalScore: number;
  accountAddr: string;
  shares: string;
  name?: string | undefined;
  avatarUrl?: string | undefined;
  wwwUrl?: string | undefined;
};

// const URLS = {
//   validatorList: (cluster: Extract<Cluster, "mainnet-beta" | "testnet">) => {
//     if (cluster === "testnet") {
//       const baseUrl = getEnv("SOLANA_TESTNET_VALIDATORS_APP_BASE_URL");
//       return `${baseUrl}/${cluster}.json?order=score&limit=${MAX_VALIDATORS_NB}`;
//     }

//     const baseUrl = getEnv("SOLANA_VALIDATORS_APP_BASE_URL");
//     return baseUrl;
//   },
// };

export async function getValidators(currencyId: string): Promise<Validator[]> {
  // TODO : remove console.log
  const api = new AptosAPI(currencyId);
  const querySecond = GetCurrentDelegatorBalancesData;
  const queryResponseSecond = await api.apolloClient.query<
    GetCurrentDelegatorBalancesQuery,
    object
  >({
    query: querySecond,
    fetchPolicy: "network-only",
  });

  const stakingData: CurrentDelegatorBalance[] =
    queryResponseSecond.data.current_delegator_balances;
  console.log("stakingData", stakingData);

  const list: Validator[] = stakingData.map(pool => {
    const imgSrc = blockies.create({ seed: pool.delegator_address }).toDataURL();
    const aptosName = pool.staking_pool_metadata.operator_aptos_name;
    const naming =
      Array.isArray(aptosName) && aptosName.length > 0 && aptosName[0].domain_with_suffix
        ? aptosName[0].domain_with_suffix
        : pool.current_pool_balance.staking_pool_address;

    // REFACTOR: use a better way to get the URL
    // Should do something like:
    // const getApiEndpoint = (currencyId: string) => isTestnet(currencyId) ? getEnv("APTOS_TESTNET_API_ENDPOINT") : getEnv("APTOS_API_ENDPOINT");
    const url = pool.current_pool_balance?.staking_pool_address
      ? `https://explorer.aptoslabs.com/account/${pool.current_pool_balance.staking_pool_address}?network=mainnet`
      : "";

    return {
      commission: parseFloat(pool.current_pool_balance.operator_commission_percentage) / 100,
      activeStake: parseInt(pool.current_pool_balance.total_coins, 10),
      shares: pool.shares,
      accountAddr: pool.current_pool_balance.staking_pool_address,
      totalScore: 1, // Do I need it?
      name: naming,
      avatarUrl: imgSrc,
      wwwUrl: url,
    };
  });

  return list.sort((a, b) => {
    if (a.activeStake > b.activeStake) {
      return -1;
    } else if (a.activeStake < b.activeStake) {
      return 1;
    }
    return 0;
  });
}
