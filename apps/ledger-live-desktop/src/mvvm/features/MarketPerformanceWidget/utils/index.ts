import { MarketItemPerformer, getChangePercentage } from "@ledgerhq/live-common/market/utils/index";
import { PortfolioRange } from "@ledgerhq/types-live";

import { CurrencyCheck, Order } from "LLD/features/MarketPerformanceWidget/types";

export function getSlicedList(list: MarketItemPerformer[], order: Order, range: PortfolioRange) {
  return list.filter(elem =>
    order === Order.asc
      ? getChangePercentage(elem, range) > 0
      : getChangePercentage(elem, range) < 0,
  );
}

export function isAvailableOnBuyOrSwap(
  id: string,
  currenciesForSwapAllSet: Set<string>,
  isCurrencyAvailable: (currencyId: string, mode: "onRamp" | "offRamp") => boolean,
  type: CurrencyCheck,
): boolean {
  return type === "onRamp" ? isCurrencyAvailable(id, "onRamp") : currenciesForSwapAllSet.has(id);
}

export function filterAvailableBuyOrSwapCurrency(
  elem: MarketItemPerformer,
  isAvailable: (id: string, type: CurrencyCheck) => boolean,
): boolean {
  const isAvailableOnBuyOrSwap = ["onRamp", "swap"].some(
    type =>
      isAvailable(elem.id, type as CurrencyCheck) ||
      elem.ledgerIds.some(lrId => isAvailable(lrId, type as CurrencyCheck)),
  );

  return isAvailableOnBuyOrSwap;
}

export function getSlicedListWithFilters(
  data: MarketItemPerformer[],
  order: Order,
  timeRange: PortfolioRange,
  enableNewFeature: boolean,
  filterAvailableBuyOrSwapCurrency: (elem: MarketItemPerformer) => boolean,
  limit: number,
): MarketItemPerformer[] {
  const baseList = getSlicedList(data ?? [], order, timeRange);

  // Filter only when enableNewFeature is true
  const filteredItems = enableNewFeature
    ? baseList.filter(filterAvailableBuyOrSwapCurrency)
    : baseList;

  const finalItems = filteredItems.length > 0 ? filteredItems : baseList;

  return finalItems.slice(0, limit);
}
