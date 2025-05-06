import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useMemo } from "react";
import { getCurrentAptosPreloadData, getAptosPreloadData } from "@ledgerhq/coin-aptos/preload-data";
import type {
  AptosMappedStakingPosition,
  AptosPreloadData,
  AptosStake,
  AptosStakeWithMeta,
  Validator,
} from "@ledgerhq/coin-aptos/types";
import { useObservable } from "../../observable";
import BigNumber from "bignumber.js";

export function useAptosPreloadData(currency: CryptoCurrency): AptosPreloadData | undefined | null {
  return useObservable(getAptosPreloadData(currency), getCurrentAptosPreloadData(currency));
}

export function useValidators(currency: CryptoCurrency, search?: string): Validator[] {
  const data = useAptosPreloadData(currency);

  return useMemo(() => {
    const validators = data?.validators ?? [];

    if (validators.length === 0 || !search || search === "") {
      return validators;
    }

    const lowercaseSearch = search.toLowerCase();

    const filtered = validators.filter(
      validator =>
        validator.name?.toLowerCase().includes(lowercaseSearch) ||
        validator.accountAddr.toLowerCase().includes(lowercaseSearch),
    );

    const flags = [];
    const output: Validator[] = [];
    for (let i = 0; i < filtered.length; i++) {
      if (flags[filtered[i].accountAddr]) continue;
      flags[filtered[i].accountAddr] = true;
      output.push(filtered[i]);
    }
    return output;
  }, [data, search]);
}

export function useAptosStakesWithMeta(
  currency: CryptoCurrency,
  stakes: AptosStake[],
): AptosStakeWithMeta[] {
  const data = useAptosPreloadData(currency);

  if (data === null || data === undefined) {
    return [];
  }

  const { validators } = data;

  const validatorByVoteAccAddr = new Map(validators.map(v => [v.accountAddr, v]));

  if (!stakes || !Array.isArray(stakes)) {
    return [];
  }

  return stakes.map(stake => {
    const voteAccAddr = stake.delegation?.voteAccAddr;
    const validator =
      voteAccAddr === undefined ? undefined : validatorByVoteAccAddr.get(voteAccAddr);

    return {
      stake,
      meta: {
        validator: {
          img: validator?.avatarUrl,
          name: validator?.name,
          url: validator?.wwwUrl,
        },
      },
    };
  });
}

export function convertToAptosMappedStakingPosition(
  stakeWithMeta: AptosStakeWithMeta,
): AptosMappedStakingPosition {
  const { stake } = stakeWithMeta;
  const OCTA_UNIT = new BigNumber(10).pow(8);
  const staked = new BigNumber(stake.delegation?.stake || 0).dividedBy(OCTA_UNIT);
  const pending = new BigNumber(stake.reward?.amount || 0).dividedBy(OCTA_UNIT);
  const available = new BigNumber(stake.withdrawable || 0).dividedBy(OCTA_UNIT);

  return {
    staked,
    available,
    pending,
    validatorId: stake.delegation?.voteAccAddr || "",
    formattedAmount: staked.toFormat(2),
    formattedPending: pending.toFormat(2),
    formattedAvailable: available.toFormat(2),
    rank: 0,
    validator: {
      validatorAddress: stake.delegation?.voteAccAddr || "",
      commission: null,
      tokens: "",
    },
  };
}
