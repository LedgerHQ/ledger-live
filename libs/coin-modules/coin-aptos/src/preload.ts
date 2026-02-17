import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getValidators } from "./network/validators";
import { setAptosPreloadData } from "./preload-data";
import { AptosPreloadData, AptosValidator } from "./types";

export const PRELOAD_MAX_AGE = 15 * 60 * 1000; // 15min

export async function preloadWithValidators(currency: CryptoCurrency): Promise<AptosPreloadData> {
  let validators: AptosValidator[] = [];
  if (getEnv("APTOS_ENABLE_STAKING") === true) {
    validators = await getValidators(currency.id);
  }

  const data: AptosPreloadData = {
    validatorsWithMeta: [],
    validators,
  };

  setAptosPreloadData(data, currency);

  return data;
}

export function hydrate(data: AptosPreloadData, currency: CryptoCurrency): void {
  setAptosPreloadData(data, currency);
}
