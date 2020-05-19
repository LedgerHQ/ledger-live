// @flow
import invariant from "invariant";
import { useEffect, useMemo, useState } from "react";
import {
  getCurrentCosmosPreloadData,
  getCosmosPreloadDataUpdates,
} from "./preloadedData";
import type {
  CosmosDelegation,
  CosmosValidatorItem,
  CosmosFormattedDelegation,
  FormatOption,
} from "./types";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import type { Account, Transaction } from "../../types";

export function useCosmosPreloadData() {
  const [state, setState] = useState(getCurrentCosmosPreloadData);
  useEffect(() => {
    const sub = getCosmosPreloadDataUpdates().subscribe(setState);
    return () => sub.unsubscribe();
  }, []);
  return state;
}

function formatDelegations(
  delegations: CosmosDelegation[],
  validators: CosmosValidatorItem[]
): CosmosFormattedDelegation[] {
  return delegations.map((d) => ({
    validator: validators.find(
      (v) => v.validatorAddress === d.validatorAddress
    ),
    address: d.validatorAddress,
    amount: d.amount,
    pendingRewards: d.pendingRewards,
    status: d.status,
  }));
}

export function useCosmosFormattedDelegations(
  account: Account,
  option?: FormatOption
): CosmosFormattedDelegation[] {
  const { validators } = useCosmosPreloadData();
  const delegations = account.cosmosResources?.delegations;
  invariant(delegations, "cosmos: delegations is required");

  const formattedDelegations = useMemo(
    () => formatDelegations(delegations, validators),
    [delegations, validators]
  );
  const unit = useMemo(() => getAccountUnit(account), [account]);

  switch (option) {
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
}

export function useCosmosDelegationsQuerySelector(
  account: Account,
  transaction: Transaction,
  option?: FormatOption
) {
  const [query, setQuery] = useState<string>("");
  const delegations = useCosmosFormattedDelegations(account, option);

  const options = useMemo<CosmosFormattedDelegation[]>(
    () =>
      delegations.filter(
        // [TODO] better query test
        ({ validator }) =>
          !query || !validator || new RegExp(query, "gi").test(validator.name)
      ),
    [query, delegations]
  );

  const selectedValidator = useMemo(
    () => transaction.validators && transaction.validators[0],
    [transaction]
  );

  const value = useMemo(() => {
    switch (option) {
      case "redelegate":
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
  }, [delegations, selectedValidator, transaction, options, option]);

  return {
    query,
    setQuery,
    options,
    value,
  };
}
