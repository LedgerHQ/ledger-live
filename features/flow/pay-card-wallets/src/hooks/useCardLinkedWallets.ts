import { useCallback, useMemo } from "react";
import {
  useGetCardLinkedWalletsQuery,
  useGetInternalWalletsQuery,
} from "@domain/api-card-management";
import { combineCardLinkedWallets } from "../logic/combineCardLinkedWallets";
import type { CardLinkedWallets, ResolveWalletCounterValue } from "../types";

export type UseCardLinkedWalletsParams = Readonly<{
  resolveCounterValue: ResolveWalletCounterValue;
  skip?: boolean;
}>;

export type UseCardLinkedWalletsResult = CardLinkedWallets &
  Readonly<{
    /** The first load only. A refetch reports through `isFetching`. */
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    refetch: () => void;
  }>;

const NO_WALLETS: readonly [] = [];

export function useCardLinkedWallets({
  resolveCounterValue,
  skip = false,
}: UseCardLinkedWalletsParams): UseCardLinkedWalletsResult {
  const linkedQuery = useGetCardLinkedWalletsQuery(undefined, { skip });
  const internalQuery = useGetInternalWalletsQuery(undefined, { skip });

  const combined = useMemo(
    () =>
      combineCardLinkedWallets({
        linked: linkedQuery.data ?? NO_WALLETS,
        internal: internalQuery.data ?? NO_WALLETS,
        resolveCounterValue,
      }),
    [linkedQuery.data, internalQuery.data, resolveCounterValue],
  );

  const { refetch: refetchLinked } = linkedQuery;
  const { refetch: refetchInternal } = internalQuery;

  const refetch = useCallback(() => {
    if (skip) {
      return;
    }

    refetchLinked();
    refetchInternal();
  }, [skip, refetchLinked, refetchInternal]);

  const {
    isLoading: linkedLoading,
    isFetching: linkedFetching,
    isError: linkedError,
  } = linkedQuery;
  const {
    isLoading: internalLoading,
    isFetching: internalFetching,
    isError: internalError,
  } = internalQuery;

  return useMemo(
    () => ({
      ...combined,
      isLoading: linkedLoading || internalLoading,
      isFetching: linkedFetching || internalFetching,
      isError: linkedError || internalError,
      refetch,
    }),
    [
      combined,
      linkedLoading,
      internalLoading,
      linkedFetching,
      internalFetching,
      linkedError,
      internalError,
      refetch,
    ],
  );
}
