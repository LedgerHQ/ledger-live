import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { flow } from "lodash/fp";
import { ChainAPI } from "./network";
import { getValidators, ValidatorsAppValidator } from "./network/validator-app";
import { setSolanaPreloadData as setPreloadData } from "./preload-data";
import { SolanaPreloadData, SolanaPreloadDataV1 } from "./types";
import { clusterByCurrencyId, profitableValidators, ledgerFirstValidators } from "./utils";

export const PRELOAD_MAX_AGE = 15 * 60 * 1000; // 15min

export async function preloadWithAPI(
  currency: CryptoCurrency,
  api: ChainAPI,
): Promise<SolanaPreloadDataV1> {
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
