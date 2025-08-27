import { useState, useCallback } from "react";
import { AssetsDataWithPagination, useGetAssetsDataQuery } from "../data/state-manager/api";

export interface UseAssetsDataResult {
  data?: AssetsDataWithPagination;
  isLoading: boolean;
  error?: unknown;
  hasMore: boolean;
  cursor?: string;
  loadNext: () => void;
}

export function useAssetsData(): UseAssetsDataResult {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const { data, isLoading, error } = useGetAssetsDataQuery({ cursor });

  const loadNext = useCallback(() => {
    const nextCursor = data?.pagination?.nextCursor;
    if (nextCursor) {
      setCursor(nextCursor);
    }
  }, [data?.pagination?.nextCursor]);

  const hasMore = Boolean(data?.pagination?.nextCursor);

  return {
    data,
    isLoading,
    error,
    hasMore,
    cursor,
    loadNext,
  };
}
