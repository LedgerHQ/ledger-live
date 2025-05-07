import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useMemo } from "react";
import { getCurrentAptosPreloadData, getAptosPreloadData } from "@ledgerhq/coin-aptos/preload-data";
import type {
  AptosAccount,
  AptosMappedStakingPosition,
  AptosPreloadData,
  AptosStake,
  AptosStakeWithMeta,
  AptosValidator,
} from "@ledgerhq/coin-aptos/types";
import { useObservable } from "../../observable";
import invariant from "invariant";
import { getAccountCurrency } from "../../account";
import { mapStakingPositions } from "./logic";

export function useAptosPreloadData(currency: CryptoCurrency): AptosPreloadData | undefined | null {
  return useObservable(getAptosPreloadData(currency), getCurrentAptosPreloadData(currency));
}

export function useValidators(currency: CryptoCurrency, search?: string): AptosValidator[] {
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
        validator.address.toLowerCase().includes(lowercaseSearch),
    );

    const flags = [];
    const output: AptosValidator[] = [];
    for (let i = 0; i < filtered.length; i++) {
      if (flags[filtered[i].address]) continue;
      flags[filtered[i].address] = true;
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

  const validatorByAddress = new Map(validators.map(v => [v.address, v]));

  return stakes.map(stake => {
    const validatorAddress = stake.delegation?.validatorAddress;
    const validator =
      validatorAddress === undefined ? undefined : validatorByAddress.get(validatorAddress);

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

export function useNearMappedStakingPositions(account: AptosAccount): AptosMappedStakingPosition[] {
  const { validators } = getCurrentAptosPreloadData(account.currency);
  const stakingPositions = account.aptosResources?.stakingPositions;

  invariant(stakingPositions, "aptos: stakingPositions is required");

  const unit = getAccountCurrency(account).units[0];

  return useMemo(() => {
    const mappedStakingPositions = mapStakingPositions(stakingPositions || [], validators, unit);
    return mappedStakingPositions;
  }, [stakingPositions, validators, unit]);
}
