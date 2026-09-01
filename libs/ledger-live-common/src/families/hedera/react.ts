import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { useMemo } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { getHederaValidators } from "@ledgerhq/coin-hedera/network/utils";
import { HEDERA_VALIDATORS_CACHE_MINUTES } from "@ledgerhq/coin-hedera/constants";
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
      isLedgerNode: validator?.isLedgerNode ?? false,
    },
  };
}

const HEDERA_VALIDATORS_CACHE_TTL_MS = HEDERA_VALIDATORS_CACHE_MINUTES * 60 * 1000;

export const hederaQueries = {
  all: () => ["hedera"] as const,
  validatorsList: (currencyId: string) =>
    queryOptions({
      queryKey: [...hederaQueries.all(), "validators", currencyId],
      // getHederaValidators owns the TTL and is the same data that getTransactionStatus validates against.
      // staleTime stays 0 to keep both reading one entry.
      // side effect: refetch and invalidateQueries are no-ops, call .clear() to force a refresh.
      queryFn: (): Promise<HederaValidator[]> => getHederaValidators(currencyId),
      retry: false,
      staleTime: 0,
      gcTime: HEDERA_VALIDATORS_CACHE_TTL_MS,
    }),
};

// replaces useHederaEnrichedDelegation once mobile migrates off the preload layer
export function useHederaEnrichedDelegationV2(
  account: HederaAccount,
  delegation: HederaDelegation,
): HederaEnrichedDelegation {
  const queryValidators = useQuery(hederaQueries.validatorsList(account.currency.id));
  const validators = queryValidators.data ?? [];
  const validatorById = new Map(validators.map(v => [v.id, v]));
  const validator = validatorById.get(String(delegation.nodeId)) ?? null;

  return {
    ...delegation,
    loading: queryValidators.isLoading,
    error: queryValidators.data === undefined ? queryValidators.error : null,
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
      isLedgerNode: validator?.isLedgerNode ?? false,
    },
  };
}
