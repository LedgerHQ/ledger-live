import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { flow } from "lodash/fp";
// import { ChainAPI } from "./network";
import { setAptosPreloadData } from "./preload-data";
import { AptosPreloadData, AptosValidator } from "./types";
import { clusterByCurrencyId, profitableValidators /* , ledgerFirstValidators */ } from "./utils";
import { getValidators } from "./network/validators";

export const PRELOAD_MAX_AGE = 15 * 60 * 1000; // 15min

export async function preloadWithAPI(
  currency: CryptoCurrency,
  // getAPI: () => Promise<ChainAPI>,
): Promise<AptosPreloadData> {
  // const api = await getAPI();

  const cluster = clusterByCurrencyId(currency.id);

  const validators: AptosValidator[] =
    // cluster === "devnet" ? await loadDevnetValidators(api) : await getValidators(cluster);
    await getValidators(currency.id);

  const data: AptosPreloadData = {
    validatorsWithMeta: [],
    validators: cluster === "mainnet" ? preprocessMainnetValidators(validators) : validators,
  };

  setAptosPreloadData(data, currency);

  return data;
}

function preprocessMainnetValidators(validators: AptosValidator[]): AptosValidator[] {
  // return flow(() => validators, profitableValidators, ledgerFirstValidators)();
  return flow(() => validators, profitableValidators)();
}

// async function loadDevnetValidators(api: ChainAPI) {
//   const voteAccs = await api.getVoteAccounts();
//   const validators: Validator[] = voteAccs.current.map(acc => ({
//     activeStake: acc.activatedStake,
//     commission: acc.commission,
//     totalScore: 0,
//     voteAccount: acc.votePubkey,
//   }));
//   return validators;
// }

export function hydrate(data: AptosPreloadData, currency: CryptoCurrency): void {
  setAptosPreloadData(data, currency);
}
