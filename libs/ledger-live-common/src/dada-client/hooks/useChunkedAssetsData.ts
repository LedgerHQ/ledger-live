import { useMemo } from "react";
import { useGetChunkedAssetsDataQuery } from "../state-manager/api";
import { GetAssetsDataParams } from "../state-manager/types";
import { parseError } from "../utils/errorUtils";

/**
 * Drop-in replacement for `useAssetsData` when all pages are needed
 * atomically (e.g. for portfolio distribution computation).
 */
export function useChunkedAssetsData(params: GetAssetsDataParams & { skip?: boolean }) {
  const { skip, ...queryParams } = params;

  const { data, isLoading, isSuccess, isError, error, refetch, isFetching } =
    useGetChunkedAssetsDataQuery(queryParams, { skip });

  const errorInfo = useMemo(() => parseError(error), [error]);

  return {
    data,
    isLoading: isLoading || (isFetching && !data),
    isSuccess,
    isError,
    error,
    errorInfo,
    refetch,
  };
}
