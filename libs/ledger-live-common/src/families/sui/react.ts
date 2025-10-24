import { useEffect, useMemo, useState } from "react";
import { FIGMENT_SUI_VALIDATOR_ADDRESS } from "@ledgerhq/coin-sui/constants";
import { BigNumber } from "bignumber.js";
import { SuiAccount, SuiResources, SuiValidator, MappedStake } from "./types";
import { getAccountCurrency } from "../../account";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { getCurrentSuiPreloadData } from "@ledgerhq/coin-sui/preload";
import { getOperationExtra } from "@ledgerhq/coin-sui/getOperationExtra";
import { OperationType } from "@ledgerhq/types-live";

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
  const ledgerValidator = sortedValidators.find(
    v => v.suiAddress === FIGMENT_SUI_VALIDATOR_ADDRESS,
  );

  if (ledgerValidator) {
    const sortedValidatorsLedgerFirst = sortedValidators.filter(
      v => v.suiAddress !== FIGMENT_SUI_VALIDATOR_ADDRESS,
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
