import invariant from "invariant";
import { useEffect, useMemo, useState } from "react";
import { getCurrentCosmosPreloadData, getCosmosPreloadDataUpdates } from "./preloadedData";
import type {
  CosmosMappedDelegation,
  CosmosValidatorItem,
  CosmosMappedValidator,
  CosmosDelegationInfo,
  CosmosOperationMode,
  CosmosSearchFilter,
  Transaction,
  CosmosPreloadData,
  CosmosAccount,
} from "./types";
import { mapDelegations, searchFilter as defaultSearchFilter } from "./logic";
import { getAccountUnit } from "../../account";
import useMemoOnce from "../../hooks/useMemoOnce";
import cryptoFactory from "./chain/chain";

export function useCosmosFamilyPreloadData(currencyId?: string): CosmosPreloadData {
  const getCurrent = getCurrentCosmosPreloadData;
  const getUpdates = getCosmosPreloadDataUpdates;

  const [state, setState] = useState(getCurrent);
  useEffect(() => {
    const sub = getUpdates().subscribe(setState);
    return () => sub.unsubscribe();
  }, [getCurrent, getUpdates]);
  return currencyId
    ? state[currencyId] ?? {
        validators: [], // NB initial state because UI need to work even if it's currently "loading", typically after clear cache
      }
    : {
        validators: [], // NB initial state because UI need to work even if it's currently "loading", typically after clear cache
      };
}

export function useCosmosFamilyMappedDelegations(
  account: CosmosAccount,
  mode?: CosmosOperationMode,
): CosmosMappedDelegation[] {
  const currencyId = account.currency.id;
  const { validators } = useCosmosFamilyPreloadData(currencyId);

  const delegations = account.cosmosResources?.delegations;
  invariant(delegations, "cosmos: delegations is required");
  const unit = getAccountUnit(account);
  return useMemo(() => {
    const mappedDelegations = mapDelegations(delegations || [], validators, unit);
    return mode === "claimReward"
      ? mappedDelegations.filter(({ pendingRewards }) => pendingRewards.gt(0))
      : mappedDelegations;
  }, [delegations, validators, mode, unit]);
}

export function useCosmosFamilyDelegationsQuerySelector(
  account: CosmosAccount,
  transaction: Transaction,
  delegationSearchFilter: CosmosSearchFilter = defaultSearchFilter,
): {
  query: string;
  setQuery: (query: string) => void;
  options: CosmosMappedDelegation[];
  value: CosmosMappedDelegation | null | undefined;
} {
  const [query, setQuery] = useState<string>("");
  const delegations = useCosmosFamilyMappedDelegations(account, transaction.mode);
  const options = useMemo<CosmosMappedDelegation[]>(
    () => delegations.filter(delegationSearchFilter(query)),
    [query, delegations, delegationSearchFilter],
  );
  const selectedValidator = transaction.validators && transaction.validators[0];
  const value = useMemo(() => {
    switch (transaction.mode) {
      case "redelegate":
        invariant(transaction.sourceValidator, "cosmos: sourceValidator is required");
        return options.find(
          ({ validatorAddress }) => validatorAddress === transaction.sourceValidator,
        );

      default:
        return (
          selectedValidator &&
          delegations.find(({ validatorAddress }) => validatorAddress === selectedValidator.address)
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
  validatorSearchFilter: CosmosSearchFilter = defaultSearchFilter,
): CosmosMappedValidator[] {
  const initialVotes = useMemoOnce(() => delegations.map(({ address }) => address));
  const mappedValidators = useMemo(
    () =>
      validators.map((validator, rank) => ({
        rank: rank + 1,
        validator,
      })),
    [validators],
  );
  const sortedVotes = useMemo(
    () =>
      mappedValidators
        .filter(({ validator }) => initialVotes.includes(validator.validatorAddress))
        .concat(
          mappedValidators.filter(
            ({ validator }) => !initialVotes.includes(validator.validatorAddress),
          ),
        ),
    [mappedValidators, initialVotes],
  );
  const sr = useMemo(
    () => (search ? mappedValidators.filter(validatorSearchFilter(search)) : sortedVotes),
    [search, mappedValidators, sortedVotes, validatorSearchFilter],
  );
  return sr;
}

export function useLedgerFirstShuffledValidatorsCosmosFamily(
  currencyId: string,
  searchInput?: string,
): CosmosValidatorItem[] {
  const data = getCurrentCosmosPreloadData()[currencyId];
  const ledgerValidatorAddress = cryptoFactory(currencyId).ledgerValidator;

  return useMemo(() => {
    return reorderValidators(data?.validators ?? [], ledgerValidatorAddress, searchInput);
  }, [data, ledgerValidatorAddress, searchInput]);
}

function reorderValidators(
  validators: CosmosValidatorItem[],
  ledgerValidatorAddress: string | undefined,
  searchInput?: string,
): CosmosValidatorItem[] {
  const sortedValidators = validators
    .filter(validator => validator.commission !== 1.0)
    .filter(validator =>
      searchInput ? validator.name.toLowerCase().includes(searchInput.toLowerCase()) : true,
    )
    .sort((a, b) => b.tokens - a.tokens);

  // move Ledger validator to the first position
  if (ledgerValidatorAddress) {
    const ledgerValidator = sortedValidators.find(
      v => v.validatorAddress === ledgerValidatorAddress,
    );

    if (ledgerValidator) {
      const sortedValidatorsLedgerFirst = sortedValidators.filter(
        v => v.validatorAddress !== ledgerValidatorAddress,
      );
      sortedValidatorsLedgerFirst.unshift(ledgerValidator);

      return sortedValidatorsLedgerFirst;
    }
  }

  return sortedValidators;
}
