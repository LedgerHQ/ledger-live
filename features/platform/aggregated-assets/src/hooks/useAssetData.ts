import { useGetAssetDataQuery, GetAssetsDataParams } from "@domain/api-aggregated-assets";

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
