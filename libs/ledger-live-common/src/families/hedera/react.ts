import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useMemo } from "react";
import {
  getCurrentHederaPreloadData,
  getHederaPreloadData,
} from "@ledgerhq/coin-hedera/preload-data";
import type {
  HederaAccount,
  HederaPreloadData,
  HederaValidator,
  HederaDelegationWithMeta,
  HederaDelegation,
} from "./types";
import { useObservable } from "../../observable";
import { getDelegationStatus } from "./logic";

export function useHederaPreloadData(
  currency: CryptoCurrency,
): HederaPreloadData | undefined | null {
  return useObservable(getHederaPreloadData(currency), getCurrentHederaPreloadData(currency));
}

export function useHederaValidators(currency: CryptoCurrency, search?: string): HederaValidator[] {
  const data = useHederaPreloadData(currency);

  return useMemo(() => {
    const validators = data?.validators ?? [];

    if (validators.length === 0 || !search || search === "") {
      return validators;
    }

    const lowercaseSearch = search.toLowerCase();

    const filtered = validators.filter(
      validator =>
        validator.nodeId.toString().includes(lowercaseSearch) ||
        validator.name.toLowerCase().includes(lowercaseSearch) ||
        validator.address.toLowerCase().includes(lowercaseSearch),
    );

    const flags = [];
    const output: HederaValidator[] = [];

    for (let i = 0; i < filtered.length; i++) {
      if (flags[filtered[i].address]) continue;
      flags[filtered[i].address] = true;
      output.push(filtered[i]);
    }

    return output;
  }, [data, search]);
}

export function useHederaDelegationWithMeta(
  account: HederaAccount,
  delegation: HederaDelegation,
): HederaDelegationWithMeta {
  const validators = useHederaValidators(account.currency);
  const validatorByNodeId = new Map(validators.map(v => [v.nodeId, v]));
  const validator = validatorByNodeId.get(delegation.nodeId) ?? null;

  return {
    ...delegation,
    status: getDelegationStatus(validator),
    validator: {
      name: validator?.name ?? "-",
      address: validator?.address ?? "",
      nodeId: delegation.nodeId,
      minStake: validator?.minStake ?? new BigNumber(0),
      maxStake: validator?.maxStake ?? new BigNumber(0),
      activeStake: validator?.activeStake ?? new BigNumber(0),
      activeStakePercentage: validator?.activeStakePercentage ?? new BigNumber(0),
      overstaked: validator?.overstaked ?? false,
    },
  };
}
