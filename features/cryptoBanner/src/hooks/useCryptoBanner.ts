import { useGetTopCryptosQuery } from "../data-layer/api/cryptoBanner.api";
import { GetTopCryptosParams } from "../data-layer/api/types";

export const useCryptoBanner = (params: GetTopCryptosParams) => {
  const { data, isLoading, error, refetch } = useGetTopCryptosQuery(params, {
    pollingInterval: 30000,
  });

  return {
    topCryptos: data || [],
    isLoading,
    error,
    refetch,
  };
};
