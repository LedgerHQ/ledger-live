import React from "react";
import { TFunction } from "i18next";
import { Virtualizer } from "@tanstack/react-virtual";
import { TableRoot, Table, TableBody } from "@ledgerhq/lumen-ui-react";
import {
  MarketCurrencyData,
  MarketListRequestParams,
} from "@ledgerhq/live-common/market/utils/types";
import TrackPage from "~/renderer/analytics/TrackPage";
import { NoCryptoPlaceholder } from "~/renderer/screens/market/MarketList/components/NoCryptoPlaceholder";
import { MarketFavoritesEmptyState } from "../MarketFavoritesEmptyState";
import { MarketRow } from "../MarketRow";
import { MarketTableHeader, SortDirection } from "./MarketTableHeader";
import { MarketTableSkeleton } from "./MarketTableSkeleton";

export type MarketTableViewProps = {
  parentRef: React.RefObject<HTMLDivElement | null>;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  marketData: MarketCurrencyData[];
  marketParams: MarketListRequestParams;
  counterCurrency?: string;
  range?: string;
  search?: string;
  locale: string;
  currenciesLength: number;
  showSkeleton: boolean;
  emptyState?: "favorites";
  resetSearch: () => void;
  isStarred: (id: string) => boolean;
  toggleStar: (id: string, isStarred: boolean) => void;
  marketCapSort: SortDirection;
  changeSort: SortDirection;
  onToggleMarketCap: () => void;
  onToggleChange: () => void;
  t: TFunction;
};

export function MarketTableView({
  parentRef,
  rowVirtualizer,
  marketData,
  marketParams,
  counterCurrency,
  range,
  search,
  locale,
  currenciesLength,
  showSkeleton,
  emptyState,
  resetSearch,
  isStarred,
  toggleStar,
  marketCapSort,
  changeSort,
  onToggleMarketCap,
  onToggleChange,
  t,
}: Readonly<MarketTableViewProps>) {
  if (emptyState === "favorites") {
    return <MarketFavoritesEmptyState t={t} />;
  }

  if (!showSkeleton && currenciesLength === 0) {
    return <NoCryptoPlaceholder requestParams={marketParams} t={t} resetSearch={resetSearch} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {search && currenciesLength > 0 && <TrackPage category="Market Search" success={true} />}
      <TableRoot
        appearance="plain"
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg"
      >
        <div className="shrink-0 overflow-x-auto overflow-y-hidden">
          <Table className="grid">
            <MarketTableHeader
              marketCapSort={marketCapSort}
              changeSort={changeSort}
              onToggleMarketCap={onToggleMarketCap}
              onToggleChange={onToggleChange}
              t={t}
            />
          </Table>
        </div>
        <div
          ref={parentRef}
          className="min-h-0 flex-1 overflow-auto scrollbar-custom [scrollbar-gutter:auto]"
        >
          {showSkeleton ? (
            <MarketTableSkeleton />
          ) : (
            <Table className="grid">
              <TableBody
                className="relative block"
                style={{ height: rowVirtualizer.getTotalSize() }}
                data-testid="market-list-data"
              >
                {rowVirtualizer.getVirtualItems().map(virtualRow => {
                  const currency = marketData[virtualRow.index];
                  if (!currency) return null;

                  return (
                    <MarketRow
                      key={currency.id}
                      size={virtualRow.size}
                      start={virtualRow.start}
                      currency={currency}
                      counterCurrency={counterCurrency}
                      locale={locale}
                      range={range}
                      isStarred={isStarred(currency.id)}
                      toggleStar={toggleStar}
                    />
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </TableRoot>
    </div>
  );
}
