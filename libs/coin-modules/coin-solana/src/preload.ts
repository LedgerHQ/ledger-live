import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { flow } from "lodash/fp";
import { ChainAPI } from "./network";
import { setSolanaPreloadData as setPreloadData } from "./preload-data";
import { SolanaPreloadData, SolanaPreloadDataV1 } from "./types";
import {
  assertUnreachable,
  clusterByCurrencyId,
  profitableValidators,
  ledgerFirstValidators,
} from "./utils";
import { getValidators, ValidatorsAppValidator } from "./network/validator-app";

export const PRELOAD_MAX_AGE = 15 * 60 * 1000; // 15min

export async function preloadWithAPI(
  currency: CryptoCurrency,
  getAPI: () => Promise<ChainAPI>,
): Promise<SolanaPreloadDataV1> {
  const api = await getAPI();

  const cluster = clusterByCurrencyId(currency.id);

  const validators: ValidatorsAppValidator[] =
    cluster === "devnet" ? await loadDevnetValidators(api) : await getValidators(cluster);

  const data: SolanaPreloadData = {
    version: "1",
    validatorsWithMeta: [],
    validators: cluster === "mainnet-beta" ? preprocessMainnetValidators(validators) : validators,
  };

  setPreloadData(data, currency);

  return data;
}

function preprocessMainnetValidators(
  validators: ValidatorsAppValidator[],
): ValidatorsAppValidator[] {
  return flow(() => validators, profitableValidators, ledgerFirstValidators)();
}

async function loadDevnetValidators(api: ChainAPI) {
  const voteAccs = await api.getVoteAccounts();
  const validators: ValidatorsAppValidator[] = voteAccs.current.map(acc => ({
    activeStake: acc.activatedStake,
    commission: acc.commission,
    totalScore: 0,
    voteAccount: acc.votePubkey,
  }));
  return validators;
}

export function hydrate(data: SolanaPreloadData | undefined, currency: CryptoCurrency): void {
  // https://ledgerhq.atlassian.net/browse/LIVE-11568 covers unknown case where version is undefined
  if (data == null || data.version == null) {
    return;
  }

  switch (data.version) {
    case "1":
      hydrateV1(data, currency);
      return;
    case "2":
      throw new Error("version 2 for now exists only to support discriminated union");
    default:
      return assertUnreachable(data);
  }
}

function hydrateV1(data: SolanaPreloadDataV1, currency: CryptoCurrency) {
  setPreloadData(data, currency);
}
