import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { flow } from "lodash/fp";
// import { ChainAPI } from "./network";
import { setAptosPreloadData as setPreloadData } from "./preload-data";
import { AptosPreloadData } from "./types";
import { clusterByCurrencyId, profitableValidators, ledgerFirstValidators } from "./utils";
import { getValidators, Validators } from "./network/validators";

export const PRELOAD_MAX_AGE = 15 * 60 * 1000; // 15min

export async function preloadWithAPI(
  currency: CryptoCurrency,
  // getAPI: () => Promise<ChainAPI>,
): Promise<AptosPreloadData> {
  // const api = await getAPI();

  const cluster = clusterByCurrencyId(currency.id);

  const validators: Validators[] =
    // cluster === "devnet" ? await loadDevnetValidators(api) : await getValidators(cluster);
    await getValidators();

  const data: AptosPreloadData = {
    validatorsWithMeta: [],
    validators: cluster === "mainnet" ? preprocessMainnetValidators(validators) : validators,
  };

  setPreloadData(data, currency);

  return data;
}

function preprocessMainnetValidators(validators: Validators[]): Validators[] {
  return flow(() => validators, profitableValidators, ledgerFirstValidators)();
}

// async function loadDevnetValidators(api: ChainAPI) {
//   const voteAccs = await api.getVoteAccounts();
//   const validators: Validators[] = voteAccs.current.map(acc => ({
//     activeStake: acc.activatedStake,
//     commission: acc.commission,
//     totalScore: 0,
//     voteAccount: acc.votePubkey,
//   }));
//   return validators;
// }

export function hydrate(data: AptosPreloadData, currency: CryptoCurrency): void {
  setPreloadData(data, currency);
}
