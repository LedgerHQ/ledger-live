import invariant from "invariant";
import { useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { FIGMENT_NEAR_VALIDATOR_ADDRESS } from "@ledgerhq/coin-near/constants";
import { mapStakingPositions } from "@ledgerhq/coin-near/logic";
import {
  NearValidatorItem,
  Transaction,
  NearMappedStakingPosition,
  NearAccount,
} from "@ledgerhq/coin-near/types";
import { getCurrentNearPreloadData } from "@ledgerhq/coin-near/preload";
import { getAccountUnit } from "../../account";

export function useNearMappedStakingPositions(account: NearAccount): NearMappedStakingPosition[] {
  const { validators } = getCurrentNearPreloadData();
  const stakingPositions = account.nearResources?.stakingPositions;

  invariant(stakingPositions, "near: stakingPositions is required");

  const unit = getAccountUnit(account);

  return useMemo(() => {
    const mappedStakingPositions = mapStakingPositions(stakingPositions || [], validators, unit);
    return mappedStakingPositions;
  }, [stakingPositions, validators, unit]);
}

export function useNearStakingPositionsQuerySelector(
  account: NearAccount,
  transaction: Transaction,
): {
  options: NearMappedStakingPosition[];
  value: NearMappedStakingPosition | undefined;
} {
  const stakingPositions = useNearMappedStakingPositions(account);
  const options = useMemo<NearMappedStakingPosition[]>(
    () =>
      stakingPositions.filter(sp =>
        transaction.mode === "unstake" ? sp.staked.gt(0) : sp.available.gt(0),
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

export function useLedgerFirstShuffledValidatorsNear(search: string) {
  const { validators: unorderedValidators } = getCurrentNearPreloadData();
  const validators = reorderValidators(unorderedValidators);

  return useMemo(() => {
    if (validators.length === 0 || !search || search === "") {
      return validators;
    }

    const lowercaseSearch = search.toLowerCase();

    const filtered = validators.filter(
      validator => validator.validatorAddress?.toLowerCase().includes(lowercaseSearch),
    );

    return filtered;
  }, [validators, search]);
}

function reorderValidators(validators: NearValidatorItem[]): NearValidatorItem[] {
  const sortedValidators = validators.sort((a, b) =>
    new BigNumber(b.tokens).minus(new BigNumber(a.tokens)).toNumber(),
  );

  // move Ledger validator to the first position
  const ledgerValidator = sortedValidators.find(
    v => v.validatorAddress === FIGMENT_NEAR_VALIDATOR_ADDRESS,
  );

  if (ledgerValidator) {
    const sortedValidatorsLedgerFirst = sortedValidators.filter(
      v => v.validatorAddress !== FIGMENT_NEAR_VALIDATOR_ADDRESS,
    );
    sortedValidatorsLedgerFirst.unshift(ledgerValidator);

    return sortedValidatorsLedgerFirst;
  }

  return sortedValidators;
}
