import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useMemo } from "react";
import {
  getCurrentHederaPreloadData,
  getHederaPreloadData,
} from "@ledgerhq/coin-hedera/preload-data";
import type { HederaPreloadData, HederaValidator } from "./types";
import { useObservable } from "../../observable";

export function useHederaPreloadData(
  currency: CryptoCurrency,
): HederaPreloadData | undefined | null {
  return useObservable(getHederaPreloadData(currency), getCurrentHederaPreloadData(currency));
}

export function useHederaValidators(currency: CryptoCurrency, search?: string): HederaValidator[] {
  const data = useHederaPreloadData(currency);

  return useMemo(() => {
    const validators = data?.validators ?? [];

    if (validators.length === 0 || !search || search === "") {
      return validators;
    }

    const lowercaseSearch = search.toLowerCase();

    const filtered = validators.filter(
      validator =>
        validator.nodeId.toString().includes(lowercaseSearch) ||
        validator.name.toLowerCase().includes(lowercaseSearch) ||
        validator.address.toLowerCase().includes(lowercaseSearch),
    );

    const flags = [];
    const output: HederaValidator[] = [];

    for (let i = 0; i < filtered.length; i++) {
      if (flags[filtered[i].address]) continue;
      flags[filtered[i].address] = true;
      output.push(filtered[i]);
    }

    return output;
  }, [data, search]);
}
