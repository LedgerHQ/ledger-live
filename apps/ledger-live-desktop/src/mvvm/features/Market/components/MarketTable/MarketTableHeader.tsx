import React, { memo } from "react";
import { TFunction } from "i18next";
import {
  TableHeader,
  TableHeaderRow,
  TableHeaderCell,
  TableSortButton,
} from "@ledgerhq/lumen-ui-react";
import {
  MARKET_TABLE_GRID_TEMPLATE,
  MARKET_CELL_CLASSNAME,
  MARKET_HEADER_CELL_END_CLASSNAME,
} from "./constants";

export type SortDirection = "asc" | "desc" | undefined;

type MarketTableHeaderProps = {
  marketCapSort: SortDirection;
  changeSort: SortDirection;
  onToggleMarketCap: () => void;
  onToggleChange: () => void;
  t: TFunction;
};

export const MarketTableHeader = memo<MarketTableHeaderProps>(function MarketTableHeader({
  marketCapSort,
  changeSort,
  onToggleMarketCap,
  onToggleChange,
  t,
}) {
  return (
    <TableHeader className="grid">
      <TableHeaderRow
        className="grid"
        style={{ gridTemplateColumns: MARKET_TABLE_GRID_TEMPLATE }}
        data-testid="market-list-header"
      >
        <TableHeaderCell className={MARKET_CELL_CLASSNAME}>
          {t("market.marketTable.crypto")}
        </TableHeaderCell>
        <TableHeaderCell align="end" className={MARKET_HEADER_CELL_END_CLASSNAME}>
          {t("market.marketTable.price")}
        </TableHeaderCell>
        <TableHeaderCell align="end" className={MARKET_HEADER_CELL_END_CLASSNAME}>
          <TableSortButton align="end" data-testid="market-sort-volume">
            {t("market.marketTable.volume")}
          </TableSortButton>
        </TableHeaderCell>
        <TableHeaderCell align="end" className={MARKET_HEADER_CELL_END_CLASSNAME}>
          <TableSortButton
            align="end"
            sortDirection={marketCapSort}
            onToggleSort={onToggleMarketCap}
            data-testid="market-sort-marketcap"
          >
            {t("market.marketTable.marketCap")}
          </TableSortButton>
        </TableHeaderCell>
        <TableHeaderCell align="end" className={MARKET_HEADER_CELL_END_CLASSNAME}>
          <TableSortButton
            align="end"
            sortDirection={changeSort}
            onToggleSort={onToggleChange}
            data-testid="market-sort-change"
          >
            {t("market.marketTable.change")}
          </TableSortButton>
        </TableHeaderCell>
        <TableHeaderCell align="end" aria-label={t("market.marketTable.actions")} />
      </TableHeaderRow>
    </TableHeader>
  );
});
