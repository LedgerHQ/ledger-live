import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { useEffect, useMemo, useState } from "react";
import { getSolanaValidators } from "@ledgerhq/coin-solana/validators";
import type { SolanaStakeWithMeta } from "@ledgerhq/coin-solana/types";
import type { StakingResources } from "@ledgerhq/types-live";
import { listSolanaStakingPositions } from "@ledgerhq/coin-solana/logic";
import type { ValidatorsAppValidator } from "@ledgerhq/coin-solana/network/validator-app/index";

// keeps the last fetched validators so remounting a screen does not flash an empty list
const lastSeenValidators = new Map<string, ValidatorsAppValidator[]>();

export function useSolanaValidators(currency: CryptoCurrency): ValidatorsAppValidator[] {
  const currencyId = currency.id;
  const [validators, setValidators] = useState<ValidatorsAppValidator[]>(
    () => lastSeenValidators.get(currencyId) ?? [],
  );

  useEffect(() => {
    let cancelled = false;

    setValidators(lastSeenValidators.get(currencyId) ?? []);
    getSolanaValidators(currencyId)
      .then(fetched => {
        lastSeenValidators.set(currencyId, fetched);
        if (!cancelled) setValidators(fetched);
      })
      // keep the last known list, like the preload store did on a failed refresh
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [currencyId]);

  return validators;
}

export function useValidators(currency: CryptoCurrency, search?: string): ValidatorsAppValidator[] {
  const validators = useSolanaValidators(currency);

  return useMemo(() => {
    if (validators.length === 0 || !search || search === "") {
      return validators;
    }

    const lowercaseSearch = search.toLowerCase();

    const filtered = validators.filter(
      validator =>
        validator.name?.toLowerCase().includes(lowercaseSearch) ||
        validator.voteAccount.toLowerCase().includes(lowercaseSearch),
    );

    const seen = new Set<string>();
    const output: ValidatorsAppValidator[] = [];
    for (const validator of filtered) {
      if (seen.has(validator.voteAccount)) continue;
      seen.add(validator.voteAccount);
      output.push(validator);
    }
    return output;
  }, [validators, search]);
}

// Takes the resources, not a position array: an array built at the call site would be a new
// reference on every render and defeat the memo.
export function useSolanaStakesWithMeta(
  currency: CryptoCurrency,
  stakingResources: StakingResources | undefined,
): SolanaStakeWithMeta[] {
  const validators = useSolanaValidators(currency);

  return useMemo(() => {
    const validatorByVoteAccAddr = new Map(validators.map(v => [v.voteAccount, v]));

    return listSolanaStakingPositions(stakingResources).map(stake => {
      const voteAccAddr = stake.validatorAddress || undefined;
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
  }, [validators, stakingResources]);
}
