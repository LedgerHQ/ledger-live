import BigNumber from "bignumber.js";
import { parseFiniteBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";
import { useState, useMemo, useEffect } from "react";
import {
  getCurrentMultiversXPreloadData,
  getMultiversXPreloadDataUpdates,
} from "@ledgerhq/coin-multiversx/preload";
import { randomizeProviders } from "@ledgerhq/coin-multiversx/helpers/randomizeProviders";
import type { MultiversXProvider } from "./types";
import { MIN_DELEGATION_AMOUNT } from "./constants";

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

// Far above the EGLD supply: anything larger is a malformed response, not a stake.
const MAX_STAKE = new BigNumber(10).pow(30);

const readStake = (value: unknown): BigNumber | undefined => {
  const stake = parseFiniteBigNumber(value);
  return stake?.isInteger() && !stake.isNegative() && stake.lt(MAX_STAKE) ? stake : undefined;
};

const stakeOf = (validator: MultiversXProvider): BigNumber =>
  readStake(validator.totalActiveStake) ?? new BigNumber(0);

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
      const alpha = validator.maxDelegationCap;
      const delegative = alpha !== "0" && validator.withDelegationCap;
      const cap = readStake(alpha);
      const stake = readStake(validator.totalActiveStake);
      const isFull = !cap || !stake || cap.minus(stake).isLessThan(MIN_DELEGATION_AMOUNT);

      return {
        ...validator,
        totalActiveStake: stakeOf(validator).toFixed(),
        disabled: delegative && isFull,
      };
    };

    // Sort by total active stake (highest first).
    const items = [...validators]
      .sort((a, b) => stakeOf(b).comparedTo(stakeOf(a)) ?? 0)
      .map(disable);

    return search ? items.filter(filter) : items;
  }, [validators, search]);
}
