import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { useMemo } from "react";
import {
  getCurrentHederaPreloadData,
  getHederaPreloadData,
} from "@ledgerhq/coin-hedera/preload-data";
import { getDelegationStatus, filterValidatorBySearchTerm } from "./utils";
import { useObservable } from "../../observable";
import type {
  HederaAccount,
  HederaPreloadData,
  HederaValidator,
  HederaDelegation,
  HederaEnrichedDelegation,
} from "./types";

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

    return validators.filter(validator => {
      return filterValidatorBySearchTerm(validator, search);
    });
  }, [data, search]);
}

export function useHederaEnrichedDelegation(
  account: HederaAccount,
  delegation: HederaDelegation,
): HederaEnrichedDelegation {
  const validators = useHederaValidators(account.currency);
  const validatorById = new Map(validators.map(v => [v.id, v]));
  const validator = validatorById.get(String(delegation.nodeId)) ?? null;

  return {
    ...delegation,
    status: getDelegationStatus(validator),
    validator: {
      name: validator?.name ?? "",
      address: validator?.address ?? "",
      addressChecksum: validator?.addressChecksum ?? null,
      id: String(delegation.nodeId),
      minStake: validator?.minStake ?? new BigNumber(0),
      maxStake: validator?.maxStake ?? new BigNumber(0),
      activeStake: validator?.activeStake ?? new BigNumber(0),
      activeStakePercentage: validator?.activeStakePercentage ?? new BigNumber(0),
      overstaked: validator?.overstaked ?? false,
    },
  };
}
