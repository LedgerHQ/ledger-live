import BigNumber from "bignumber.js";
import { useMemo } from "react";
import { useGetValidatorsQuery } from "./state-manager/api";
import { filterValidatorBySearchTerm, getDelegationStatus } from "./utils";
import type {
  HederaAccount,
  HederaValidator,
  HederaDelegation,
  HederaEnrichedDelegation,
} from "./types";

export type HederaValidatorsQuery = {
  validators: HederaValidator[];
  loading: boolean;
  error: Error | null;
};

export function useHederaValidators(currencyId: string, search?: string): HederaValidatorsQuery {
  const { data, isLoading, error } = useGetValidatorsQuery(currencyId);

  const validators = useMemo(() => {
    const all = data ?? [];
    return search ? all.filter(v => filterValidatorBySearchTerm(v, search)) : all;
  }, [data, search]);

  return {
    validators,
    loading: isLoading,
    // an error while validators are already cached is not worth showing, the list still renders
    error: data === undefined && error instanceof Error ? error : null,
  };
}

export function useHederaEnrichedDelegation(
  account: HederaAccount,
  delegation: HederaDelegation,
): HederaEnrichedDelegation {
  const { validators, loading, error } = useHederaValidators(account.currency.id);
  const validatorById = new Map(validators.map(v => [v.id, v]));
  const validator = validatorById.get(String(delegation.nodeId)) ?? null;

  return {
    ...delegation,
    loading,
    error,
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
