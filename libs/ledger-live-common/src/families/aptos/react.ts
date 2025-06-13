import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useMemo } from "react";
import { getCurrentAptosPreloadData, getAptosPreloadData } from "@ledgerhq/coin-aptos/preload-data";
import type {
  AptosAccount,
  AptosMappedStakingPosition,
  AptosPreloadData,
  AptosValidator,
  Transaction,
} from "./types";
import { useObservable } from "../../observable";
import { getAccountCurrency } from "../../account";
import { mapStakingPositions } from "./staking";

export function useAptosPreloadData(currency: CryptoCurrency): AptosPreloadData | undefined | null {
  return useObservable(getAptosPreloadData(currency), getCurrentAptosPreloadData(currency));
}

export function useAptosValidators(currency: CryptoCurrency, search?: string): AptosValidator[] {
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

export function useAptosMappedStakingPositions(
  account: AptosAccount,
): AptosMappedStakingPosition[] {
  const validators = useAptosValidators(account.currency, "");
  const stakingPositions = account.aptosResources?.stakingPositions;

  const unit = getAccountCurrency(account).units[0];

  return useMemo(() => {
    const mappedStakingPositions = mapStakingPositions(stakingPositions || [], validators, unit);
    return mappedStakingPositions;
  }, [stakingPositions, validators, unit]);
}

export function useAptosStakingPositionsQuerySelector(
  account: AptosAccount,
  transaction: Transaction,
): {
  options: AptosMappedStakingPosition[];
  value: AptosMappedStakingPosition | undefined;
} {
  const stakingPositions = useAptosMappedStakingPositions(account);
  const options = useMemo<AptosMappedStakingPosition[]>(
    () =>
      stakingPositions.filter(sp =>
        transaction.mode === "unstake" ? sp.active.gt(0) : sp.inactive.gt(0),
      ),
    [stakingPositions, transaction],
  );

  const selectedValidatorAddress = transaction.recipient;

  const value = useMemo(
    () => stakingPositions.find(({ validatorId }) => validatorId === selectedValidatorAddress),
    [stakingPositions, selectedValidatorAddress],
  );

  return {
    options,
    value,
  };
}
