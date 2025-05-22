import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { setAptosPreloadData } from "./preload-data";
import { AptosPreloadData, AptosValidator } from "./types";
import { getValidators } from "./network/validators";

export const PRELOAD_MAX_AGE = 15 * 60 * 1000; // 15min

export async function preloadWithValidators(currency: CryptoCurrency): Promise<AptosPreloadData> {
  const validators: AptosValidator[] = await getValidators(currency.id);

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
