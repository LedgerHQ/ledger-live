import BigNumber from "bignumber.js";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { getHederaValidators } from "@ledgerhq/coin-hedera/network/utils";
import { HEDERA_VALIDATORS_CACHE_MINUTES } from "@ledgerhq/coin-hedera/constants";
import { getDelegationStatus } from "./utils";
import type {
  HederaAccount,
  HederaValidator,
  HederaDelegation,
  HederaEnrichedDelegation,
} from "./types";

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
      staleTime: 0,
      gcTime: HEDERA_VALIDATORS_CACHE_TTL_MS,
    }),
};

export function useHederaEnrichedDelegation(
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
