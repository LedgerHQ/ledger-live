import { useMemo, useState } from "react";
import invariant from "invariant";
import { isStakingAccount, type Account } from "@ledgerhq/types-live";
import {
  resolveSourceValidator,
  resolveTransactionValidators,
} from "@ledgerhq/live-common/families/cosmos/buildTransaction";
import { mapDelegations, searchFilter } from "@ledgerhq/live-common/families/cosmos/logic";
import type {
  CosmosMappedDelegation,
  CosmosOperationMode,
  Transaction,
} from "@ledgerhq/live-common/families/cosmos/types";
import { useCosmosNetworkValidators } from "./useCosmosNetworkValidators";

/** The account's delegations joined with the network validators; an unknown validator shows its address. */
export function useCosmosMappedDelegations(
  account: Account,
  mode?: CosmosOperationMode,
): CosmosMappedDelegation[] {
  invariant(isStakingAccount(account), "cosmos staking account required");
  const { delegations } = account.stakingResources;
  const { validators } = useCosmosNetworkValidators(account.currency);
  const unit = account.currency.units[0];
  return useMemo(() => {
    const mapped = mapDelegations(delegations, validators, unit);
    return mode === "claimReward"
      ? mapped.filter(({ pendingRewards }) => pendingRewards.gt(0))
      : mapped;
  }, [delegations, validators, mode, unit]);
}

/** The delegations to pick from in a flow, filtered by the typed query, and the one the transaction targets. */
export function useCosmosDelegationsQuerySelector(account: Account, transaction: Transaction) {
  const [query, setQuery] = useState("");
  const delegations = useCosmosMappedDelegations(account, transaction.mode);
  const options = useMemo(() => delegations.filter(searchFilter(query)), [query, delegations]);
  const value = useMemo(() => {
    if (transaction.mode === "redelegate") {
      const sourceValidator = resolveSourceValidator(transaction);
      invariant(sourceValidator, "cosmos: sourceValidator is required");
      return options.find(({ validatorAddress }) => validatorAddress === sourceValidator);
    }
    const selected = resolveTransactionValidators(transaction)[0];
    return (
      selected && delegations.find(({ validatorAddress }) => validatorAddress === selected.address)
    );
  }, [delegations, transaction, options]);
  return { query, setQuery, options, value };
}
