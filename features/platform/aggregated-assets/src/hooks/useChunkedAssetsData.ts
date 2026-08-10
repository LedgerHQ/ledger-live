import { useMemo } from "react";
import {
  useGetChunkedAssetsDataQuery,
  GetAssetsDataParams,
  parseError,
} from "@domain/api-aggregated-assets";

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
