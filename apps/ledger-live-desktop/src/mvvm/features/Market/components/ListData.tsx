import React, { memo } from "react";
import { Virtualizer } from "@tanstack/react-virtual";
import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { RowItem } from "./RowItem";

type ListDataProps = {
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  marketData: MarketCurrencyData[];
  starredMarketCoins: string[];
  counterCurrency?: string;
  locale: string;
  range?: string;
  toggleStar: (id: string, isStarred: boolean) => void;
};

export const ListData = memo<ListDataProps>(function ListData({
  rowVirtualizer,
  marketData,
  starredMarketCoins,
  counterCurrency,
  locale,
  range,
  toggleStar,
}) {
  return (
    <div
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: "100%",
        position: "relative",
      }}
      data-testid="market-list-data"
    >
      {rowVirtualizer.getVirtualItems().map(virtualRow => {
        const currency = marketData[virtualRow.index];
        if (!currency) return null;

        const isStarred = starredMarketCoins.includes(currency.id);

        return (
          <RowItem
            key={currency.id}
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
            isStarred={isStarred}
            toggleStar={() => toggleStar(currency.id, isStarred)}
            locale={locale}
            range={range}
          />
        );
      })}
    </div>
  );
});
