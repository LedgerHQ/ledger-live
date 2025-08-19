import { useState, useCallback } from "react";
import { useGetAssetsDataQuery } from "../data/state-manager/api";

export function useAssetsData({ search }: { search?: string }) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const { data, error, isLoading, isSuccess } = useGetAssetsDataQuery({ cursor, search });

  const loadNext = useCallback(() => {
    const nextCursor = data?.pagination?.nextCursor;
    if (nextCursor) {
      setCursor(nextCursor);
    }
  }, [data?.pagination?.nextCursor]);

  const hasMore = Boolean(data?.pagination?.nextCursor);

  return {
    data,
    error,
    isLoading,
    isSuccess,
    hasMore,
    cursor,
    loadNext,
  };
}
