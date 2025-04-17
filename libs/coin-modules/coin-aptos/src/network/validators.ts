// import network from "@ledgerhq/live-network/network";
// import { Cluster } from "@solana/web3.js";
// import { compact } from "lodash/fp";
// import { getEnv } from "@ledgerhq/live-env";
import * as blockies from "blockies-ts";
import { AptosAPI } from "../api";
import {
  GetNumActiveDelegatorPerPoolData,
  GetCurrentDelegatorBalancesData,
} from "../api/graphql/queries";
import {
  CurrentDelegatorBalance,
  DelegationPoolAddress,
  GetCurrentDelegatorBalancesQuery,
  GetNumActiveDelegatorPerPoolQuery,
} from "../api/graphql/types";

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

// export async function getValidators(
//   cluster: Extract<Cluster, "mainnet-beta" | "testnet">,
// ): Promise<Validator[]> {
//   const response = await network({
//     method: "GET",
//     url: URLS.validatorList(cluster),
//   });

//   const allRawValidators =
//     response.status === 200 ? (response.data as ValidatorRaw[]) : [];

//   // validators app data is not clean: random properties can randomly contain
//   // data, null, undefined
//   const tryFromRawValidator = (
//     validator: ValidatorRaw,
//   ): Validator | undefined => {
//     if (
//       typeof validator.active_stake === "number" &&
//       typeof validator.commission === "number" &&
//       typeof validator.total_score === "number" &&
//       typeof validator.vote_account === "string" &&
//       validator.delinquent !== true
//     ) {
//       return {
//         activeStake: validator.active_stake,
//         commission: validator.commission,
//         totalScore: validator.total_score,
//         voteAccount: validator.vote_account,
//         name: validator.name ?? undefined,
//         avatarUrl: validator.avatar_url ?? undefined,
//         wwwUrl: validator.www_url ?? undefined,
//       };
//     }

//     return undefined;
//   };

//   return compact(allRawValidators.map(tryFromRawValidator));
// }

// export async function getValidators(): Promise<Validator[]> {
//   return [
//     {
//       activeStake: 31076550,
//       commission: 100,
//       totalScore: 1992799,
//       accountAddr: "0xa651c7c52d64a2014379902bbc92439d196499bcc36d94ff0395aa45837c66db",
//       name: "0xa651c7c52d64a2014379902bbc92439d196499bcc36d94ff0395aa45837c66db",
//       avatarUrl: undefined,
//       wwwUrl: undefined,
//     },
//   ];
// }

export async function getValidators(currencyId: string): Promise<Validator[]> {
  // TODO : remove console.log
  // REFACTOR: Move it to a function ??
  // Get the list of Active Delegation Pool

  const api = new AptosAPI(currencyId);

  const query = GetNumActiveDelegatorPerPoolData;

  const queryResponse = await api.apolloClient.query<GetNumActiveDelegatorPerPoolQuery, object>({
    query,
    fetchPolicy: "network-only",
  });

  const delegatedStakingPools: DelegationPoolAddress[] = queryResponse.data.delegated_staking_pools;

  // REFACTOR: Move it to a function ??
  // Get datailed information from Validator Nodes
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

  // Filter the list of Validator Nodes based on ActiveDelegators
  const list: Validator[] = stakingData
    .filter((pool): boolean =>
      delegatedStakingPools.some(delegator => {
        return delegator.staking_pool_address === pool.current_pool_balance?.staking_pool_address;
      }),
    )
    .map(pool => {
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
        accountAddr: pool.shares,
        totalScore: 1, // Do I need it?
        name: naming,
        avatarUrl: imgSrc,
        wwwUrl: url,
      };
    });

  return list;
}
