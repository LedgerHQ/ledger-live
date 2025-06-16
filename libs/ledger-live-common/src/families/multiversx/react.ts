import { BigNumber } from "bignumber.js";
import { useState, useMemo, useEffect } from "react";
import {
  getCurrentMultiversXPreloadData,
  getMultiversXPreloadDataUpdates,
} from "@ledgerhq/coin-multiversx/preload";
import { randomizeProviders } from "@ledgerhq/coin-multiversx/helpers/randomizeProviders";
import type { MultiversXProvider } from "./types";
import { MULTIVERSX_LEDGER_VALIDATOR_ADDRESS, MIN_DELEGATION_AMOUNT } from "./constants";

export function useMultiversXPreloadData() {
  const [state, setState] = useState(getCurrentMultiversXPreloadData);
  useEffect(() => {
    const sub = getMultiversXPreloadDataUpdates().subscribe(data => {
      setState(data);
    });
    return () => sub.unsubscribe();
  }, []);
  return state;
}

export function useMultiversXRandomizedValidators(): MultiversXProvider[] {
  const { validators } = useMultiversXPreloadData();
  return useMemo(() => randomizeProviders(validators), [validators]);
}

type EnhancedValidator = MultiversXProvider & { disabled: boolean };

export function useSearchValidators(validators: MultiversXProvider[], search: string) {
  return useMemo(() => {
    const needle = search.toLowerCase();

    // Filter the providers such that they'll match the possible search criteria.
    const filter = (validator: MultiversXProvider) => {
      const [foundByContract, foundByName]: Array<boolean> = [
        validator.contract.toLowerCase().includes(needle),
        validator.identity.name ? validator.identity.name.toLowerCase().includes(needle) : false,
      ];

      return foundByName || foundByContract;
    };

    // Map the providers such that they'll be assigned the "disabled" key if conditions are met.
    const disable = (validator: MultiversXProvider): EnhancedValidator => {
      const [alpha, beta] = [validator.maxDelegationCap, validator.totalActiveStake];
      const delegative = alpha !== "0" && validator.withDelegationCap;
      const difference = new BigNumber(alpha).minus(beta);

      return Object.assign(validator, {
        disabled: delegative && difference.isLessThan(MIN_DELEGATION_AMOUNT),
      });
    };

    // Sort the providers such that Figment by Ledger will always be first.
    const sort = (validator: MultiversXProvider) =>
      validator.contract === MULTIVERSX_LEDGER_VALIDATOR_ADDRESS ? -1 : 1;
    const items = validators.sort(sort).map(disable);

    return search ? items.filter(filter) : items;
  }, [validators, search]);
}
