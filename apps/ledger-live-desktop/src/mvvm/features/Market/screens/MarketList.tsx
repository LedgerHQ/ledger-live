import React, { memo, RefObject } from "react";
import { TFunction } from "i18next";
import { Virtualizer } from "@tanstack/react-virtual";
import {
  MarketCurrencyData,
  MarketListRequestParams,
} from "@ledgerhq/live-common/market/utils/types";
import TrackPage from "~/renderer/analytics/TrackPage";
import { SortTableCell } from "~/renderer/screens/market/components/SortTableCell";
import { TableCell, TableRow } from "~/renderer/screens/market/components/Table";
import { NoCryptoPlaceholder } from "~/renderer/screens/market/MarketList/components/NoCryptoPlaceholder";
import { MarketRowItem } from "../components/MarketRowItem";
import { Star, StarFill } from "@ledgerhq/lumen-ui-react/symbols";

type MarketListVirtualization = {
  parentRef: RefObject<HTMLDivElement>;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
};

type MarketListProps = {
  starredMarketCoins: string[];
  loading: boolean;
  freshLoading: boolean;
  currenciesLength: number;
  marketParams: MarketListRequestParams;
  locale: string;
  marketData: MarketCurrencyData[];
  resetSearch: () => void;
  toggleFilterByStarredAccounts: () => void;
  toggleSortBy: () => void;
  toggleStar: (id: string, isStarred: boolean) => void;
  t: TFunction;
  virtualization: MarketListVirtualization;
};

function MarketList({
  starredMarketCoins,
  marketParams,
  loading,
  freshLoading,
  currenciesLength,
  locale,
  marketData,
  resetSearch,
  toggleFilterByStarredAccounts,
  toggleSortBy,
  toggleStar,
  virtualization,
  t,
}: MarketListProps) {
  const { order, search, starred, range, counterCurrency } = marketParams;
  const { parentRef, rowVirtualizer } = virtualization;

  if (!currenciesLength && !loading) {
    return <NoCryptoPlaceholder requestParams={marketParams} t={t} resetSearch={resetSearch} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-md bg-surface-hover">
      {search && currenciesLength > 0 && <TrackPage category="Market Search" success={true} />}
      <div className="px-20">
        <TableRow header>
          <SortTableCell data-testid="market-sort-button" onClick={toggleSortBy} order={order}>
            #
          </SortTableCell>
          <TableCell disabled>{t("market.marketList.crypto")}</TableCell>
          <TableCell disabled>{t("market.marketList.price")}</TableCell>
          <TableCell disabled>{t("market.marketList.change")}</TableCell>
          <TableCell disabled>{t("market.marketList.marketCap")}</TableCell>
          <TableCell disabled>{t("market.marketList.last7d")}</TableCell>
          <TableCell
            data-testid="market-star-button"
            disabled={starredMarketCoins.length <= 0 && (!starred || starred.length <= 0)}
            onClick={toggleFilterByStarredAccounts}
          >
            {starred && starred.length > 0 ? (
              <StarFill size={16} />
            ) : (
              <Star size={16} style={{ fill: "none" }} />
            )}
          </TableCell>
        </TableRow>
      </div>

      <div
        ref={parentRef}
        className="min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const currency = marketData[virtualRow.index];
            const isLoading = freshLoading || !currency;
            const isStarred = currency && starredMarketCoins.includes(currency.id);

            return (
              <MarketRowItem
                key={currency?.id ?? virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                currency={currency}
                counterCurrency={counterCurrency}
                loading={isLoading}
                isStarred={!!isStarred}
                toggleStar={() => currency?.id && toggleStar(currency.id, !!isStarred)}
                locale={locale}
                range={range}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(MarketList);
