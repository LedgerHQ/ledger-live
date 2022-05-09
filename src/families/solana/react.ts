import { CryptoCurrency } from "@ledgerhq/cryptoassets";
import { useMemo } from "react";
import { useObservable } from "../../observable";
import {
  getCurrentSolanaPreloadData,
  getSolanaPreloadData,
} from "./js-preload-data";
import { SolanaPreloadDataV1, SolanaStake, SolanaStakeWithMeta } from "./types";

export function useSolanaPreloadData(
  currency: CryptoCurrency
): SolanaPreloadDataV1 | undefined | null {
  return useObservable(
    getSolanaPreloadData(currency),
    getCurrentSolanaPreloadData(currency)
  );
}

export function useValidators(currency: CryptoCurrency) {
  const data = useSolanaPreloadData(currency);

  return useMemo(() => {
    return data?.validators ?? [];
  }, [data]);
}

export function useSolanaStakesWithMeta(
  currency: CryptoCurrency,
  stakes: SolanaStake[]
): SolanaStakeWithMeta[] {
  const data = useSolanaPreloadData(currency);

  if (data === null || data === undefined) {
    return [];
  }

  const { validators } = data;

  const validatorByVoteAccAddr = new Map(
    validators.map((v) => [v.voteAccount, v])
  );

  return stakes.map((stake) => {
    const voteAccAddr = stake.delegation?.voteAccAddr;
    const validator =
      voteAccAddr === undefined
        ? undefined
        : validatorByVoteAccAddr.get(voteAccAddr);

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
