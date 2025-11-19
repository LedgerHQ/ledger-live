import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { P2P_SUI_VALIDATOR_ADDRESS } from "@ledgerhq/coin-sui/constants";
import { BigNumber } from "bignumber.js";
import { SuiAccount, SuiResources, SuiValidator, MappedStake } from "./types";
import { getAccountCurrency } from "../../account";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { getCurrentSuiPreloadData } from "@ledgerhq/coin-sui/preload";
import { getOperationExtra } from "@ledgerhq/coin-sui/getOperationExtra";
import { OperationType } from "@ledgerhq/types-live";
import { fetchSuiBannerConfig, registerSuiStakingPromotion, SuiBannerConfig } from "./api";

export function useSuiMappedStakingPositions(account: SuiAccount) {
  const { validators } = getCurrentSuiPreloadData();
  const stakingPositions = account.suiResources?.stakes;

  const unit = getAccountCurrency(account).units[0];

  return useMemo(
    () => mapStakingPositions(stakingPositions ?? [], validators, unit),
    [stakingPositions, validators, unit],
  );
}

export function useGetExtraDetails(account: SuiAccount, type: OperationType, digest: string) {
  if (!account.suiResources) {
    account.suiResources = {};
  }
  if (!account.suiResources.cachedOps) {
    account.suiResources.cachedOps = {};
  }
  const cache = account.suiResources.cachedOps;
  const [data, setData] = useState(cache[digest]);

  useEffect(() => {
    if (type !== "DELEGATE" && type !== "UNDELEGATE") return;
    if (data) return;
    getOperationExtra(digest).then(result => {
      setData(result);
      cache[digest] = result;
    });
  }, [data, digest, cache, type]);

  return data;
}

export function useLedgerFirstShuffledValidatorsSui(search: string) {
  const { validators: unorderedValidators } = getCurrentSuiPreloadData();
  const validators = reorderValidators(unorderedValidators);
  return useMemo(() => {
    if (validators.length === 0 || !search || search === "") {
      return validators;
    }

    const lowercaseSearch = search.toLowerCase();

    const filtered = validators.filter(
      validator =>
        validator.suiAddress?.toLowerCase().includes(lowercaseSearch) ||
        validator.name.toLowerCase().includes(lowercaseSearch),
    );

    return filtered;
  }, [validators, search]);
}

function reorderValidators(validators: SuiValidator[]): SuiValidator[] {
  const sortedValidators = [...validators].sort((a, b) =>
    new BigNumber(b.stakingPoolSuiBalance).minus(new BigNumber(a.stakingPoolSuiBalance)).toNumber(),
  );

  // move Ledger validator to the first position
  const ledgerValidator = sortedValidators.find(v => v.suiAddress === P2P_SUI_VALIDATOR_ADDRESS);

  if (ledgerValidator) {
    const sortedValidatorsLedgerFirst = sortedValidators.filter(
      v => v.suiAddress !== P2P_SUI_VALIDATOR_ADDRESS,
    );
    sortedValidatorsLedgerFirst.unshift(ledgerValidator);

    return sortedValidatorsLedgerFirst;
  }

  return sortedValidators;
}

type Stake = Required<SuiResources>["stakes"];

export const mapStakingPositions = (
  stakingPositions: Stake,
  validators: SuiValidator[],
  unit: Unit,
): MappedStake[] => {
  const data = stakingPositions.flatMap(sp =>
    sp.stakes.map(s => ({ ...s, validatorAddress: sp.validatorAddress })),
  );
  return data.map<MappedStake>(sp => {
    const rank = validators.findIndex(v => v.suiAddress === sp.validatorAddress);
    const validator = validators[rank] ?? sp;
    const formatConfig = {
      disableRounding: false,
      alwaysShowSign: false,
      showCode: true,
    };

    return {
      ...sp,
      rank,
      validator,
      stakedSuiId: sp.stakedSuiId,
      formattedAmount: formatCurrencyUnit(unit, BigNumber(sp.principal), formatConfig),
      formattedEstimatedReward: formatCurrencyUnit(
        unit,
        BigNumber(sp.status === "Active" ? sp.estimatedReward : 0),
        formatConfig,
      ),
    };
  });
};

/**
 * Hook to get Sui staking banner configuration
 * Returns both boost and incentive banner flags
 *
 * Uses React Query for caching - cache is invalidated after successful stake registration
 * Defaults to false for both flags while loading or on error (fail-safe)
 *
 * @param address - The Sui address to check registration status for
 */
export function useSuiStakingBanners(address?: string): SuiBannerConfig {
  const { data } = useQuery({
    queryKey: ["sui", "banner-config", address],
    queryFn: () => fetchSuiBannerConfig(address),
    staleTime: Infinity,
    retry: 2,
  });

  return data ?? { showBoostBanner: false, showIncentiveBanner: false };
}

/**
 * Hook to handle Sui staking promotion registration
 * Returns a function that registers the address and invalidates the banner cache
 *
 * Call this after a successful stake transaction with >= 30 SUI on P2P validator
 */
export function useSuiStakingPromotionRegistration() {
  const queryClient = useQueryClient();

  return async (address: string) => {
    await registerSuiStakingPromotion(address);
    queryClient.invalidateQueries({ queryKey: ["sui", "banner-config", address] });
  };
}
