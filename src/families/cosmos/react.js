// @flow
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { useEffect, useMemo, useState } from "react";
import {
  getCurrentCosmosPreloadData,
  getCosmosPreloadDataUpdates,
} from "./preloadedData";
import type {
  CosmosMappedDelegation,
  CosmosValidatorItem,
  CosmosMappedValidator,
  CosmosDelegationInfo,
  CosmosOperationMode,
  CosmosSearchFilter,
  Transaction,
  CosmosExtraTxInfo,
  CosmosDelegation,
} from "./types";
import {
  calculateFees,
  mapDelegations,
  mapDelegationInfo,
  searchFilter as defaultSearchFilter,
  COSMOS_MAX_REDELEGATIONS,
  COSMOS_MAX_UNBONDINGS,
  COSMOS_MIN_FEES,
  COSMOS_MAX_DELEGATIONS,
} from "./utils";
import { getAccountUnit } from "../../account";
import useMemoOnce from "../../hooks/useMemoOnce";
import type { Account } from "../../types";

export function useCosmosPreloadData() {
  const [state, setState] = useState(getCurrentCosmosPreloadData);
  useEffect(() => {
    const sub = getCosmosPreloadDataUpdates().subscribe(setState);
    return () => sub.unsubscribe();
  }, []);
  return state;
}

export function useCosmosMappedDelegations(
  account: Account,
  mode?: CosmosOperationMode
): CosmosMappedDelegation[] {
  const { validators } = useCosmosPreloadData();
  const delegations = account.cosmosResources?.delegations;
  invariant(delegations, "cosmos: delegations is required");

  const unit = getAccountUnit(account);

  return useMemo(() => {
    const mappedDelegations = mapDelegations(delegations, validators, unit);

    return mode === "claimReward"
      ? mappedDelegations.filter(({ pendingRewards }) => pendingRewards.gt(0))
      : mappedDelegations;
  }, [delegations, validators, mode, unit]);
}

export function useCosmosDelegationsQuerySelector(
  account: Account,
  transaction: Transaction,
  delegationSearchFilter?: CosmosSearchFilter = defaultSearchFilter
): {
  query: string,
  setQuery: (query: string) => void,
  options: CosmosMappedDelegation[],
  value: ?CosmosMappedDelegation,
} {
  const [query, setQuery] = useState<string>("");
  const delegations = useCosmosMappedDelegations(account, transaction.mode);

  const options = useMemo<CosmosMappedDelegation[]>(
    () => delegations.filter(delegationSearchFilter(query)),
    [query, delegations, delegationSearchFilter]
  );

  const selectedValidator = transaction.validators && transaction.validators[0];

  const value = useMemo(() => {
    switch (transaction.mode) {
      case "redelegate":
        invariant(
          transaction.cosmosSourceValidator,
          "cosmos: cosmosSourceValidator is required"
        );
        return options.find(
          ({ validatorAddress }) =>
            validatorAddress === transaction.cosmosSourceValidator
        );
      default:
        return (
          selectedValidator &&
          delegations.find(
            ({ validatorAddress }) =>
              validatorAddress === selectedValidator.address
          )
        );
    }
  }, [delegations, selectedValidator, transaction, options]);

  return {
    query,
    setQuery,
    options,
    value,
  };
}

export function getMaxDelegationAvailable(
  account: Account,
  validatorsLength: number
): BigNumber {
  const numberOfDelegations = Math.min(
    COSMOS_MAX_DELEGATIONS,
    validatorsLength || 1
  );
  const { spendableBalance } = account;

  return spendableBalance.minus(
    COSMOS_MIN_FEES.multipliedBy(numberOfDelegations)
  );
}

/** Hook to search and sort SR list according to initial votes and query */
export function useSortedValidators(
  search: string,
  validators: CosmosValidatorItem[],
  delegations: CosmosDelegationInfo[],
  validatorSearchFilter?: CosmosSearchFilter = defaultSearchFilter
): CosmosMappedValidator[] {
  const initialVotes = useMemoOnce(() =>
    delegations.map(({ address }) => address)
  );

  const mappedValidators = useMemo(
    () =>
      validators.map((validator, rank) => ({
        rank: rank + 1,
        validator,
      })),
    [validators]
  );

  const sortedVotes = useMemo(
    () =>
      mappedValidators
        .filter(({ validator }) =>
          initialVotes.includes(validator.validatorAddress)
        )
        .concat(
          mappedValidators.filter(
            ({ validator }) =>
              !initialVotes.includes(validator.validatorAddress)
          )
        ),
    [mappedValidators, initialVotes]
  );

  const sr = useMemo(
    () =>
      search
        ? mappedValidators.filter(validatorSearchFilter(search))
        : sortedVotes,
    [search, mappedValidators, sortedVotes, validatorSearchFilter]
  );

  return sr;
}

export function useMappedExtraOperationDetails({
  account,
  extra,
}: {
  account: Account,
  extra: CosmosExtraTxInfo,
}) {
  const { validators } = useCosmosPreloadData();
  const unit = getAccountUnit(account);

  return {
    validators: extra.validators
      ? mapDelegationInfo(extra.validators, validators, unit)
      : undefined,
    validator: extra.validator
      ? mapDelegationInfo([extra.validator], validators, unit)[0]
      : undefined,
    cosmosSourceValidator: extra.cosmosSourceValidator
      ? extra.cosmosSourceValidator
      : undefined,
  };
}

export function canUndelegate(account: Account): boolean {
  const { cosmosResources } = account;

  invariant(cosmosResources, "cosmosResources should exist");
  return (
    cosmosResources.unbondings &&
    cosmosResources.unbondings.length < COSMOS_MAX_UNBONDINGS
  );
}

export function canDelegate(account: Account): boolean {
  const maxSpendableBalance = getMaxDelegationAvailable(account, 1);
  return maxSpendableBalance.gt(0);
}

export function canRedelegate(
  account: Account,
  delegation: CosmosDelegation
): boolean {
  const { cosmosResources } = account;

  invariant(cosmosResources, "cosmosResources should exist");
  return (
    cosmosResources.redelegations.length < COSMOS_MAX_REDELEGATIONS &&
    !cosmosResources.redelegations.some(
      (rd) => rd.validatorDstAddress === delegation.validatorAddress
    )
  );
}

export async function canClaimRewards(
  account: Account,
  delegation: CosmosDelegation
): Promise<boolean> {
  const { cosmosResources } = account;

  invariant(cosmosResources, "cosmosResources should exist");

  const res = await calculateFees({
    a: account,
    t: {
      family: "cosmos",
      mode: "claimReward",
      amount: BigNumber(0),
      fees: null,
      gasLimit: null,
      recipient: "",
      useAllAmount: false,
      networkInfo: null,
      memo: null,
      cosmosSourceValidator: null,
      validators: [
        { address: delegation.validatorAddress, amount: BigNumber(0) },
      ],
    },
  });

  return (
    res.estimatedFees.lt(account.spendableBalance) &&
    res.estimatedFees.lt(delegation.pendingRewards)
  );
}
