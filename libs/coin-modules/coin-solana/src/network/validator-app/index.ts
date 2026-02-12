import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";
import { Cluster } from "@solana/web3.js";
import { compact } from "lodash/fp";

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
  name?: string | undefined;
  avatarUrl?: string | undefined;
  wwwUrl?: string | undefined;
  apy?: number | undefined;
};

type ValidatorApyRaw = {
  address: string;
  delegator_apy: number;
  name: string;
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
  validatorApylist: getEnv("SOLANA_VALIDATORS_SUMMARY_BASE_URL"),
};

async function fetchFigmentApy(
  cluster: Extract<Cluster, "mainnet-beta" | "testnet">,
): Promise<Record<string, number>> {
  if (cluster !== "mainnet-beta") return {};
  try {
    const response = await network({
      method: "GET",
      url: URLS.validatorApylist,
    });

    if (response.status === 200 && Array.isArray(response.data)) {
      return response.data.reduce((acc: Record<string, number>, item: ValidatorApyRaw) => {
        if (typeof item.address === "string" && typeof item.delegator_apy === "number") {
          acc[item.address] = item.delegator_apy;
        }
        return acc;
      }, {});
    }
  } catch (error) {
    console.warn("Failed to fetch Figment APY", error);
  }

  return {};
}

export async function getValidators(
  cluster: Extract<Cluster, "mainnet-beta" | "testnet">,
): Promise<ValidatorsAppValidator[]> {
  const [validatorsResponse, apyMap] = await Promise.all([
    network({ method: "GET", url: URLS.validatorList(cluster) }),
    fetchFigmentApy(cluster),
  ]);

  const allRawValidators =
    validatorsResponse.status === 200
      ? (validatorsResponse.data as ValidatorsAppValidatorRaw[])
      : [];

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
        apy: apyMap[validator.vote_account],
      };
    }

    return undefined;
  };

  return compact(allRawValidators.map(tryFromRawValidator));
}
