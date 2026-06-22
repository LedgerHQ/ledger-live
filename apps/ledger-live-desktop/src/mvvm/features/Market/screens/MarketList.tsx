import React, { memo, RefObject } from "react";
import { TFunction } from "i18next";
import type { Virtualizer, VirtualItem } from "@tanstack/react-virtual";
import {
  MarketCurrencyData,
  MarketListRequestParams,
} from "@ledgerhq/live-common/market/utils/types";
import TrackPage from "~/renderer/analytics/TrackPage";
import { NoCryptoPlaceholder } from "~/renderer/screens/market/MarketList/components/NoCryptoPlaceholder";
import { ScrollContainer } from "LLD/components/ScrollContainer";
import { ListHeader } from "../components/ListHeader";
import { ListSkeleton } from "../components/ListSkeleton";
import { ListData } from "../components/ListData";
import { MarketFavoritesEmptyState } from "../components/MarketFavoritesEmptyState";

type MarketListVirtualization = {
  parentRef: RefObject<HTMLDivElement | null>;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  virtualItems: VirtualItem[];
  totalSize: number;
};

type MarketListProps = {
  starredMarketCoins: string[];
  freshLoading: boolean;
  isError: boolean;
  currenciesLength: number;
  marketParams: MarketListRequestParams;
  locale: string;
  marketData: MarketCurrencyData[];
  emptyState?: "favorites";
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
  freshLoading,
  isError,
  currenciesLength,
  locale,
  marketData,
  emptyState,
  resetSearch,
  toggleFilterByStarredAccounts,
  toggleSortBy,
  toggleStar,
  virtualization,
  t,
}: Readonly<MarketListProps>) {
  const { order, search, starred, range, counterCurrency } = marketParams;
  const { parentRef, virtualItems, totalSize } = virtualization;

  if (emptyState === "favorites") {
    return <MarketFavoritesEmptyState t={t} />;
  }

  // Only show skeleton on initial load or error, not during background refetches
  const showSkeleton = freshLoading || isError;
  const showData = !showSkeleton && currenciesLength > 0;

  if (!showData && !showSkeleton) {
    return <NoCryptoPlaceholder requestParams={marketParams} t={t} resetSearch={resetSearch} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-t-md bg-surface">
      {search && currenciesLength > 0 && <TrackPage category="Market Search" success={true} />}
      <ListHeader
        order={order}
        starredMarketCoins={starredMarketCoins}
        starred={starred}
        onToggleSortBy={toggleSortBy}
        onToggleFilterByStarredAccounts={toggleFilterByStarredAccounts}
        t={t}
      />

      <ScrollContainer ref={parentRef}>
        {showSkeleton ? (
          <ListSkeleton />
        ) : (
          showData && (
            <ListData
              virtualItems={virtualItems}
              totalSize={totalSize}
              marketData={marketData}
              starredMarketCoins={starredMarketCoins}
              counterCurrency={counterCurrency}
              locale={locale}
              range={range}
              toggleStar={toggleStar}
            />
          )
        )}
      </ScrollContainer>
    </div>
  );
}

export default memo(MarketList);
