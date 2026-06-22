import { AssetsDataWithPagination } from "../state-manager/types";

const emptyData = (): AssetsDataWithPagination => ({
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

export function mergeAssetsDataPages(
  pages: AssetsDataWithPagination[] | undefined,
): AssetsDataWithPagination | undefined {
  return pages?.reduce<AssetsDataWithPagination>((acc, page) => {
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
}
