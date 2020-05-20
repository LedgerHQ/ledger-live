// @flow
import invariant from "invariant";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCurrentCosmosPreloadData,
  getCosmosPreloadDataUpdates,
} from "./preloadedData";
import type {
  CosmosFormattedDelegation,
  CosmosValidatorItem,
  CosmosDelegationInfo,
  CosmosOperationMode,
  Transaction,
} from "./types";
import { formatDelegations, searchFilter } from "./utils";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
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
    const formattedDelegations = formatDelegations(delegations, validators);

    switch (mode) {
      case "claimReward":
        return formattedDelegations
          .filter(({ pendingRewards }) => pendingRewards.gt(0))
          .map(({ pendingRewards, ...rest }) => ({
            ...rest,
            pendingRewards,
            reward: formatCurrencyUnit(unit, pendingRewards, {
              disableRounding: true,
              alwaysShowSign: false,
              showCode: true,
            }),
          }));
      case "redelegate":
      case "undelegate":
        return formattedDelegations.map((d) => ({
          ...d,
          formattedAmount: formatCurrencyUnit(unit, d.amount, {
            disableRounding: true,
            alwaysShowSign: false,
            showCode: true,
          }),
        }));
      default:
        return formattedDelegations;
    }
  }, [delegations, validators, unit, mode]);
}

export function useCosmosDelegationsQuerySelector(
  account: Account,
  transaction: Transaction
) {
  const [query, setQuery] = useState<string>("");
  const delegations = useCosmosFormattedDelegations(account, transaction.mode);

  const options = useMemo<CosmosFormattedDelegation[]>(
    () =>
      delegations.filter(
        // [TODO] better query test
        ({ validator }) =>
          !query || !validator || new RegExp(query, "gi").test(validator.name)
      ),
    [query, delegations]
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
          ({ address }) => address === transaction.cosmosSourceValidator
        );
      default:
        return (
          selectedValidator &&
          delegations.find(
            ({ address }) => address === selectedValidator.address
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
  delegations: CosmosDelegationInfo[]
): {
  validator: CosmosValidatorItem,
  name: ?string,
  address: string,
  rank: number,
}[] {
  const initialVotes = useMemoOnce(() =>
    delegations.map(({ address }) => address)
  );

  const formattedValidators = useMemo(
    () =>
      validators.map((validator, rank) => ({
        validator,
        name: validator.name,
        address: validator.validatorAddress,
        rank: rank + 1,
      })),
    [validators]
  );

  const sortedVotes = useMemo(
    () =>
      formattedValidators
        .filter(({ address }) => initialVotes.includes(address))
        .concat(
          formattedValidators.filter(
            ({ address }) => !initialVotes.includes(address)
          )
        ),
    [formattedValidators, initialVotes]
  );

  const sr = useMemo(
    () =>
      search ? formattedValidators.filter(searchFilter(search)) : sortedVotes,
    [search, formattedValidators, sortedVotes]
  );

  return sr;
}
