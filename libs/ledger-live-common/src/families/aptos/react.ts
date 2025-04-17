import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useMemo } from "react";
import { getCurrentAptosPreloadData, getAptosPreloadData } from "@ledgerhq/coin-aptos/preload-data";
import type {
  AptosPreloadData,
  AptosStake,
  AptosStakeWithMeta,
  Validator,
} from "@ledgerhq/coin-aptos/types";
import { useObservable } from "../../observable";

export function useAptosPreloadData(currency: CryptoCurrency): AptosPreloadData | undefined | null {
  return useObservable(getAptosPreloadData(currency), getCurrentAptosPreloadData(currency));
}

export function useValidators(currency: CryptoCurrency, search?: string): Validator[] {
  const data = useAptosPreloadData(currency);

  return useMemo(() => {
    const validators = data?.validators ?? [];

    if (validators.length === 0 || !search || search === "") {
      return validators;
    }

    const lowercaseSearch = search.toLowerCase();

    const filtered = validators.filter(
      validator =>
        validator.name?.toLowerCase().includes(lowercaseSearch) ||
        validator.accountAddr.toLowerCase().includes(lowercaseSearch),
    );

    const flags = [];
    const output: Validator[] = [];
    for (let i = 0; i < filtered.length; i++) {
      if (flags[filtered[i].accountAddr]) continue;
      flags[filtered[i].accountAddr] = true;
      output.push(filtered[i]);
    }
    return output;
  }, [data, search]);
}

export function useAptosStakesWithMeta(
  currency: CryptoCurrency,
  stakes: AptosStake[],
): AptosStakeWithMeta[] {
  const data = useAptosPreloadData(currency);

  if (data === null || data === undefined) {
    return [];
  }

  const { validators } = data;

  const validatorByVoteAccAddr = new Map(validators.map(v => [v.accountAddr, v]));

  return stakes.map(stake => {
    const voteAccAddr = stake.delegation?.voteAccAddr;
    const validator =
      voteAccAddr === undefined ? undefined : validatorByVoteAccAddr.get(voteAccAddr);

    return {
      stake,
      meta: {
        validator: {
          img: validator?.avatarUrl,
          name: validator?.name,
          url: validator?.wwwUrl,
        },
      },
    };
  });
}
