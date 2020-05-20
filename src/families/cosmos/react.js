// @flow
import invariant from "invariant";
import { useEffect, useMemo, useState } from "react";
import {
  getCurrentCosmosPreloadData,
  getCosmosPreloadDataUpdates,
} from "./preloadedData";
import type {
  CosmosFormattedDelegation,
  CosmosValidatorItem,
  CosmosFormattedValidator,
  CosmosDelegationInfo,
  CosmosOperationMode,
  CosmosDelegationSearchFilter,
  CosmosValidatorSearchFilter,
  Transaction,
} from "./types";
import {
  formatDelegations,
  delegationSearchFilter as defaultDelegationSearchFilter,
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

export function useCosmosFormattedDelegations(
  account: Account,
  mode?: CosmosOperationMode
): CosmosFormattedDelegation[] {
  const { validators } = useCosmosPreloadData();
  const delegations = account.cosmosResources?.delegations;
  invariant(delegations, "cosmos: delegations is required");

  const unit = getAccountUnit(account);

  return useMemo(() => {
    const formattedDelegations = formatDelegations(
      delegations,
      validators,
      unit
    );

    return mode === "claimReward"
      ? formattedDelegations.filter(({ pendingRewards }) =>
          pendingRewards.gt(0)
        )
      : formattedDelegations;
  }, [delegations, validators, mode, unit]);
}

export function useCosmosDelegationsQuerySelector(
  account: Account,
  transaction: Transaction,
  delegationSearchFilter?: CosmosDelegationSearchFilter = defaultDelegationSearchFilter
) {
  const [query, setQuery] = useState<string>("");
  const delegations = useCosmosFormattedDelegations(account, transaction.mode);

  const options = useMemo<CosmosFormattedDelegation[]>(
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

/** Hook to search and sort SR list according to initial votes and query */
export function useSortedValidators(
  search: string,
  validators: CosmosValidatorItem[],
  delegations: CosmosDelegationInfo[],
  validatorSearchFilter?: CosmosValidatorSearchFilter = defaultDelegationSearchFilter
): CosmosFormattedValidator[] {
  const initialVotes = useMemoOnce(() =>
    delegations.map(({ address }) => address)
  );

  const formattedValidators = useMemo(
    () =>
      validators.map((validator, rank) => ({
        rank: rank + 1,
        validator,
      })),
    [validators]
  );

  const sortedVotes = useMemo(
    () =>
      formattedValidators
        .filter(({ validator }) =>
          initialVotes.includes(validator.validatorAddress)
        )
        .concat(
          formattedValidators.filter(
            ({ validator }) =>
              !initialVotes.includes(validator.validatorAddress)
          )
        ),
    [formattedValidators, initialVotes]
  );

  const sr = useMemo(
    () =>
      search
        ? formattedValidators.filter(validatorSearchFilter(search))
        : sortedVotes,
    [search, formattedValidators, sortedVotes, validatorSearchFilter]
  );

  return sr;
}
