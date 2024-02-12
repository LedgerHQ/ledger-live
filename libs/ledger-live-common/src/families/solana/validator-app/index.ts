import network from "@ledgerhq/live-network/network";
import { Cluster } from "@solana/web3.js";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { compact } from "lodash/fp";
import { getEnv } from "@ledgerhq/live-env";

const MAX_VALIDATORS_NB = 1000; // Max number of validators to fetch

export type ValidatorsAppValidatorRaw = {
  active_stake?: number | null;
  commission?: number | null;
  total_score?: number | null;
  vote_account?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  delinquent?: boolean | null;
  www_url?: string | null;
};

export type ValidatorsAppValidator = {
  activeStake: number;
  commission: number;
  totalScore: number;
  voteAccount: string;
  name?: string;
  avatarUrl?: string;
  wwwUrl?: string;
};

const URLS = {
  validatorList: (cluster: Extract<Cluster, "mainnet-beta" | "testnet">) => {
    if (cluster === "testnet") {
      const baseUrl = getEnv("SOLANA_TESTNET_VALIDATORS_APP_BASE_URL");
      return `${baseUrl}/${cluster}.json?order=score&limit=${MAX_VALIDATORS_NB}`;
    }

    const baseUrl = getEnv("SOLANA_VALIDATORS_APP_BASE_URL");
    return baseUrl;
  },
};

export async function getValidators(
  cluster: Extract<Cluster, "mainnet-beta" | "testnet">,
): Promise<ValidatorsAppValidator[]> {
  const config: AxiosRequestConfig = {
    method: "GET",
    url: URLS.validatorList(cluster),
  };

  const response: AxiosResponse<ValidatorsAppValidatorRaw[]> = await network(config);

  const allRawValidators = response.status === 200 ? response.data : [];

  // validators app data is not clean: random properties can randomly contain
  // data, null, undefined
  const tryFromRawValidator = (
    validator: ValidatorsAppValidatorRaw,
  ): ValidatorsAppValidator | undefined => {
    if (
      typeof validator.active_stake === "number" &&
      typeof validator.commission === "number" &&
      typeof validator.total_score === "number" &&
      typeof validator.vote_account === "string" &&
      validator.delinquent !== true
    ) {
      return {
        activeStake: validator.active_stake,
        commission: validator.commission,
        totalScore: validator.total_score,
        voteAccount: validator.vote_account,
        name: validator.name ?? undefined,
        avatarUrl: validator.avatar_url ?? undefined,
        wwwUrl: validator.www_url ?? undefined,
      };
    }

    return undefined;
  };

  return compact(allRawValidators.map(tryFromRawValidator));
}
