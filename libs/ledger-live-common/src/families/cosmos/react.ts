import invariant from "invariant";
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
  CosmosPreloadData,
} from "./types";
import {
  mapDelegations,
  mapDelegationInfo,
  searchFilter as defaultSearchFilter,
} from "./logic";
import { getAccountUnit } from "../../account";
import useMemoOnce from "../../hooks/useMemoOnce";
import type { Account } from "../../types";
import { LEDGER_VALIDATOR_ADDRESS } from "./utils";

export function useCosmosPreloadData(): CosmosPreloadData {
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
    const mappedDelegations = mapDelegations(
      delegations || [],
      validators,
      unit
    );
    return mode === "claimReward"
      ? mappedDelegations.filter(({ pendingRewards }) => pendingRewards.gt(0))
      : mappedDelegations;
  }, [delegations, validators, mode, unit]);
}

export function useCosmosDelegationsQuerySelector(
  account: Account,
  transaction: Transaction,
  delegationSearchFilter: CosmosSearchFilter = defaultSearchFilter
): {
  query: string;
  setQuery: (query: string) => void;
  options: CosmosMappedDelegation[];
  value: CosmosMappedDelegation | null | undefined;
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

/** Hook to search and sort SR list according to initial votes and query */
export function useSortedValidators(
  search: string,
  validators: CosmosValidatorItem[],
  delegations: CosmosDelegationInfo[],
  validatorSearchFilter: CosmosSearchFilter = defaultSearchFilter
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
  account: Account;
  extra: CosmosExtraTxInfo;
}): CosmosExtraTxInfo {
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

export function useLedgerFirstShuffledValidatorsCosmos() {
  const data = useCosmosPreloadData();

  return useMemo(() => {
    return reorderValidators(data?.validators ?? []);
  }, [data]);
}

function reorderValidators(
  validators: CosmosValidatorItem[]
): CosmosValidatorItem[] {
  const sortedValidators = validators
    .filter((validator) => validator.commission !== 1.0)
    .sort((a, b) => b.votingPower - a.votingPower);

  // move Ledger validator to the first position
  const ledgerValidator = sortedValidators.find(
    (v) => v.validatorAddress === LEDGER_VALIDATOR_ADDRESS
  );

  if (ledgerValidator) {
    const sortedValidatorsLedgerFirst = sortedValidators.filter(
      (v) => v.validatorAddress !== LEDGER_VALIDATOR_ADDRESS
    );
    sortedValidatorsLedgerFirst.unshift(ledgerValidator);

    return sortedValidatorsLedgerFirst;
  }

  return sortedValidators;
}
