import { useMemo } from "react";
import { useGetAssetsDataInfiniteQuery } from "../state-manager/api";
import { AssetsDataWithPagination, GetAssetsDataParams } from "../state-manager/types";
import { parseError } from "../utils/errorUtils";

const emptyData = () => ({
  cryptoAssets: {},
  networks: {},
  cryptoOrTokenCurrencies: {},
  interestRates: {},
  markets: {},
  currenciesOrder: {
    metaCurrencyIds: [],
    key: "",
    order: "",
  },
  pagination: { nextCursor: "" },
});

export function useAssetsData({
  search,
  currencyIds,
  useCase,
  areCurrenciesFiltered,
  product,
  version,
  isStaging,
  includeTestNetworks,
  skip,
}: GetAssetsDataParams & {
  areCurrenciesFiltered?: boolean;
  skip?: boolean;
}) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    isSuccess,
    refetch,
    isFetching,
    isError,
    isFetchingNextPage,
  } = useGetAssetsDataInfiniteQuery(
    {
      search,
      useCase,
      currencyIds: areCurrenciesFiltered ? currencyIds : undefined,
      product,
      version,
      isStaging,
      includeTestNetworks,
    },
    { skip },
  );

  const joinedPages = useMemo(() => {
    return data?.pages.reduce<AssetsDataWithPagination>((acc, page) => {
      Object.assign(acc.cryptoAssets, page.cryptoAssets);
      Object.assign(acc.networks, page.networks);
      Object.assign(acc.cryptoOrTokenCurrencies, page.cryptoOrTokenCurrencies);
      Object.assign(acc.interestRates, page.interestRates);
      Object.assign(acc.markets, page.markets);

      acc.currenciesOrder.metaCurrencyIds.push(...page.currenciesOrder.metaCurrencyIds);

      acc.currenciesOrder.key = page.currenciesOrder.key;
      acc.currenciesOrder.order = page.currenciesOrder.order;
      acc.pagination.nextCursor = page.pagination.nextCursor;

      return acc;
    }, emptyData());
  }, [data]);

  const hasMore = Boolean(joinedPages?.pagination.nextCursor);

  const isInitialLoading = isLoading || (isFetching && !isFetchingNextPage);

  const errorInfo = useMemo(() => parseError(error), [error]);

  return {
    data: joinedPages,
    isLoading: isInitialLoading,
    isFetchingNextPage,
    error,
    errorInfo,
    loadNext: hasMore ? fetchNextPage : undefined,
    isSuccess,
    isError,
    refetch,
  };
}
