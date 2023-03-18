import { Cluster } from "@solana/web3.js";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { compact } from "lodash/fp";
import { getEnv } from "../../../env";
import network from "../../../network";

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

  // not used data
  /*
  network: string;
  account: string;
  keybase_id: string | null;
  www_url: string | null;
  details: string | null;
  created_at: Date;
  updated_at: Date;
  admin_warning: string | null;
  root_distance_score: number;
  vote_distance_score: number;
  skipped_slot_score: number;
  software_version: string;
  software_version_score: number;
  stake_concentration_score: number;
  data_center_concentration_score: number;
  published_information_score: number;
  security_report_score: number;
  data_center_key: string;
  data_center_host: string | null;
  authorized_withdrawer_score: number;
  autonomous_system_number: number;
  latitude: string;
  longitude: string;
  url: string;
  */
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
    const clusterSlug = cluster === "mainnet-beta" ? "mainnet" : cluster;
    const baseUrl = getEnv("SOLANA_VALIDATORS_APP_BASE_URL");
    return `${baseUrl}/${clusterSlug}.json?order=score&limit=${MAX_VALIDATORS_NB}`;
  },
};

export async function getValidators(
  cluster: Extract<Cluster, "mainnet-beta" | "testnet">
): Promise<ValidatorsAppValidator[]> {
  const config: AxiosRequestConfig = {
    method: "GET",
    url: URLS.validatorList(cluster),
  };

  const response: AxiosResponse<ValidatorsAppValidatorRaw[]> = await network(
    config
  );

  const allRawValidators = response.status === 200 ? response.data : [];

  // validators app data is not clean: random properties can randomly contain
  // data, null, undefined
  const tryFromRawValidator = (
    v: ValidatorsAppValidatorRaw
  ): ValidatorsAppValidator | undefined => {
    if (
      typeof v.active_stake === "number" &&
      typeof v.commission === "number" &&
      typeof v.total_score === "number" &&
      typeof v.vote_account === "string" &&
      v.delinquent !== true
    ) {
      return {
        activeStake: v.active_stake,
        commission: v.commission,
        totalScore: v.total_score,
        voteAccount: v.vote_account,
        name: v.name ?? undefined,
        avatarUrl: v.avatar_url ?? undefined,
        wwwUrl: v.www_url ?? undefined,
      };
    }
    return undefined;
  };

  // FIXME Ordering of validators must be always the same, for this test to be stable:
  // https://github.com/LedgerHQ/ledger-live-common/blob/develop/src/__tests__/test-helpers/bridge.ts#L171-L188
  return compact(allRawValidators.map(tryFromRawValidator));
}
