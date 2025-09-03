import { useMemo } from "react";
import { AssetsDataWithPagination, useGetAssetsDataInfiniteQuery } from "../data/state-manager/api";

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
}: {
  search?: string;
  currencyIds?: string[];
  useCase?: string;
  areCurrenciesFiltered?: boolean;
  product: "llm" | "lld";
  version: string;
}) {
  const { data, isLoading, error, fetchNextPage, isSuccess, refetch } =
    useGetAssetsDataInfiniteQuery({
      search,
      useCase,
      currencyIds: areCurrenciesFiltered ? currencyIds : undefined,
      product,
      version,
    });

  const joinedPages = useMemo(() => {
    return data?.pages.reduce<AssetsDataWithPagination>((acc, page) => {
      Object.assign(acc.cryptoAssets, page.cryptoAssets);
      Object.assign(acc.networks, page.networks);
      Object.assign(acc.cryptoOrTokenCurrencies, page.cryptoOrTokenCurrencies);
      Object.assign(acc.interestRates, page.interestRates);
      Object.assign(acc.markets, page.markets);

      acc.currenciesOrder.currenciesIds.push(...page.currenciesOrder.currenciesIds);
      acc.currenciesOrder.metaCurrencyIds.push(...page.currenciesOrder.metaCurrencyIds);

      acc.currenciesOrder.key = page.currenciesOrder.key;
      acc.currenciesOrder.order = page.currenciesOrder.order;
      acc.pagination.nextCursor = page.pagination.nextCursor;

      return acc;
    }, emptyData());
  }, [data]);

  const hasMore = Boolean(joinedPages?.pagination.nextCursor);

  return {
    data: joinedPages,
    isLoading,
    error,
    loadNext: hasMore ? fetchNextPage : undefined,
    isSuccess,
    refetch,
  };
}
