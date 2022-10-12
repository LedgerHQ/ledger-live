import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useMemo } from "react";
import { useObservable } from "../../observable";
import {
  getCurrentSolanaPreloadData,
  getSolanaPreloadData,
} from "./js-preload-data";
import { SolanaPreloadDataV1, SolanaStake, SolanaStakeWithMeta } from "./types";
import { ValidatorsAppValidator } from "./validator-app";

export function useSolanaPreloadData(
  currency: CryptoCurrency
): SolanaPreloadDataV1 | undefined | null {
  return useObservable(
    getSolanaPreloadData(currency),
    getCurrentSolanaPreloadData(currency)
  );
}

export function useValidators(
  currency: CryptoCurrency,
  search?: string
): ValidatorsAppValidator[] {
  const data = useSolanaPreloadData(currency);

  return useMemo(() => {
    const validators = data?.validators ?? [];

    if (validators.length === 0 || !search || search === "") {
      return validators;
    }

    const lowercaseSearch = search.toLowerCase();

    const filtered = validators.filter(
      (validator) =>
        validator.name?.toLowerCase().includes(lowercaseSearch) ||
        validator.voteAccount.toLowerCase().includes(lowercaseSearch)
    );

    const flags = [];
    const output: ValidatorsAppValidator[] = [];
    for (let i = 0; i < filtered.length; i++) {
      if (flags[filtered[i].voteAccount]) continue;
      flags[filtered[i].voteAccount] = true;
      output.push(filtered[i]);
    }
    return output;
  }, [data, search]);
}

export function useSolanaStakesWithMeta(
  currency: CryptoCurrency,
  stakes: SolanaStake[]
): SolanaStakeWithMeta[] {
  const data = useSolanaPreloadData(currency);

  if (data === null || data === undefined) {
    return [];
  }

  const { validators } = data;

  const validatorByVoteAccAddr = new Map(
    validators.map((v) => [v.voteAccount, v])
  );

  return stakes.map((stake) => {
    const voteAccAddr = stake.delegation?.voteAccAddr;
    const validator =
      voteAccAddr === undefined
        ? undefined
        : validatorByVoteAccAddr.get(voteAccAddr);

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
