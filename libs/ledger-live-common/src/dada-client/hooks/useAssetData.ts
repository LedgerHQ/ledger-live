import { useGetAssetDataQuery } from "../state-manager/api";
import { GetAssetsDataParams } from "../state-manager/types";

export function useAssetData({ currencyIds, product, version, isStaging }: GetAssetsDataParams) {
  const { data, isLoading, error, isSuccess, refetch, isFetching, isError } = useGetAssetDataQuery({
    currencyIds,
    product,
    version,
    isStaging,
  });

  const isInitialLoading = isLoading || isFetching;

  return {
    data,
    isLoading: isInitialLoading,
    error,
    isSuccess,
    isError,
    refetch,
  };
}
