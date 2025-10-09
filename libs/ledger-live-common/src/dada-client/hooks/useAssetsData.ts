import { useMemo } from "react";
import { useGetAssetsDataInfiniteQuery } from "../state-manager/api";
import { AssetsDataWithPagination } from "../state-manager/types";

// Updated to support polling and pageSize parameters

const emptyData = () => ({
  cryptoAssets: {},
  networks: {},
  cryptoOrTokenCurrencies: {},
  interestRates: {},
  markets: {},
  currenciesOrder: {
    currenciesIds: [],
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
  pageSize,
  pollingInterval,
}: {
  search?: string;
  currencyIds?: string[];
  useCase?: string;
  areCurrenciesFiltered?: boolean;
  product: "llm" | "lld";
  version: string;
  isStaging?: boolean;
  pageSize?: number;
  pollingInterval?: number;
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
      pageSize,
    },
    {
      pollingInterval: pollingInterval || 0,
      skipPollingIfUnfocused: false,
    },
  );

  // Optimized merge with deduplication using Set for performance
  const joinedPages = useMemo(() => {
    if (!data?.pages?.length) return emptyData();

    return data.pages.reduce<AssetsDataWithPagination>((acc, page) => {
      // Merge objects (Object.assign handles duplicates by overwriting)
      Object.assign(acc.cryptoAssets, page.cryptoAssets);
      Object.assign(acc.networks, page.networks);
      Object.assign(acc.cryptoOrTokenCurrencies, page.cryptoOrTokenCurrencies);
      Object.assign(acc.interestRates, page.interestRates);
      Object.assign(acc.markets, page.markets);

      // Efficient deduplication using Set for arrays
      const existingCurrenciesIds = new Set(acc.currenciesOrder.currenciesIds);
      const existingMetaCurrencyIds = new Set(acc.currenciesOrder.metaCurrencyIds);

      // Add only new items to prevent duplicates
      page.currenciesOrder.currenciesIds.forEach(id => {
        if (!existingCurrenciesIds.has(id)) {
          acc.currenciesOrder.currenciesIds.push(id);
          existingCurrenciesIds.add(id);
        }
      });

      page.currenciesOrder.metaCurrencyIds.forEach(id => {
        if (!existingMetaCurrencyIds.has(id)) {
          acc.currenciesOrder.metaCurrencyIds.push(id);
          existingMetaCurrencyIds.add(id);
        }
      });

      // Update order metadata from the latest page
      acc.currenciesOrder.key = page.currenciesOrder.key;
      acc.currenciesOrder.order = page.currenciesOrder.order;
      acc.pagination.nextCursor = page.pagination.nextCursor;

      return acc;
    }, emptyData());
  }, [data]);

  // With mergePages function, RTK Query handles order changes automatically
  // No need for manual order detection and refetching

  const hasMore = Boolean(joinedPages?.pagination.nextCursor);

  const isInitialLoading = isLoading || (isFetching && !isFetchingNextPage);

  return {
    data: joinedPages,
    isLoading: isInitialLoading,
    error,
    loadNext: hasMore ? fetchNextPage : undefined,
    isSuccess,
    isError,
    refetch,
  };
}
