// @flow
import type { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { useEffect, useMemo, useState } from "react";
import {
  getCurrentCosmosPreloadData,
  getCosmosPreloadDataUpdates,
} from "./preloadedData";
import type {
  CosmosDelegation,
  CosmosValidatorItem,
  CosmosDelegationStatus,
  CosmosFormattedDelegation,
} from "./types";
import type { Account } from "../../types";

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
  return delegations.map((d, i, arr) => ({
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
  account: Account
): CosmosFormattedDelegation[] {
  const { validators } = useCosmosPreloadData();
  const delegations = account.cosmosResources?.delegations;
  invariant(delegations, "cosmos: delegations is required");

  return useMemo(() => formatDelegations(delegations, validators), [
    delegations,
    validators,
  ]);
}
