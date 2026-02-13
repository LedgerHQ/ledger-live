import React, { memo, RefObject } from "react";
import styled from "styled-components";
import { Flex, Icon } from "@ledgerhq/react-ui";
import { TFunction } from "i18next";
import { Virtualizer } from "@tanstack/react-virtual";
import {
  MarketCurrencyData,
  MarketListRequestParams,
} from "@ledgerhq/live-common/market/utils/types";
import TrackPage from "~/renderer/analytics/TrackPage";
import { SortTableCell } from "../components/SortTableCell";
import { TableCell, TableRow } from "../components/Table";
import { NoCryptoPlaceholder } from "./components/NoCryptoPlaceholder";
import { MarketRowItem } from "./components/MarketRowItem";

const ScrollContainer = styled.div`
  flex: 1;
  overflow: auto;
  width: 100%;
  min-height: 0;
`;

type MarketListVirtualization = {
  parentRef: RefObject<HTMLDivElement | null>;
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
    <Flex flex="1" flexDirection="column" minHeight={0}>
      {search && currenciesLength > 0 && <TrackPage category="Market Search" success={true} />}
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
          <Icon name={starred && starred.length > 0 ? "StarSolid" : "Star"} size={18} />
        </TableCell>
      </TableRow>

      <ScrollContainer ref={parentRef}>
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
      </ScrollContainer>
    </Flex>
  );
}

export default memo(MarketList);
