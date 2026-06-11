import React, { memo } from "react";
import { TFunction } from "i18next";
import { TableRow, TableCell, TableCellContent, Trend, Tag } from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { MARKET_TABLE_GRID_TEMPLATE, MARKET_CELL_CLASSNAME } from "../MarketTable/constants";
import { MarketRowActions, MarketRowActionsProps } from "./MarketRowActions";

export type MarketRowViewProps = {
  style: React.CSSProperties;
  currency: MarketCurrencyData;
  isStarred: boolean;
  priceChangePercentage: number | undefined;
  formattedPrice: string;
  formattedVolume: string;
  formattedMarketCap: string;
  onCurrencyClick: () => void;
  swapAction: MarketRowActionsProps["swapAction"];
  buySellAction: MarketRowActionsProps["buySellAction"];
  earnAction: MarketRowActionsProps["earnAction"];
  onFavouriteSelect: () => void;
  onMenuOpenChange: (open: boolean) => void;
  t: TFunction;
};

export const MarketRowView = memo<MarketRowViewProps>(function MarketRowView({
  style,
  currency,
  isStarred,
  priceChangePercentage,
  formattedPrice,
  formattedVolume,
  formattedMarketCap,
  onCurrencyClick,
  swapAction,
  buySellAction,
  earnAction,
  onFavouriteSelect,
  onMenuOpenChange,
  t,
}: MarketRowViewProps) {
  const ticker = currency.ticker.toUpperCase();

  return (
    <TableRow
      clickable
      onClick={onCurrencyClick}
      data-testid={`market-${currency.ticker}-row`}
      className="absolute left-0 top-0 grid w-full items-center"
      style={{ ...style, gridTemplateColumns: MARKET_TABLE_GRID_TEMPLATE }}
    >
      <TableCell className={MARKET_CELL_CLASSNAME}>
        <TableCellContent
          leadingContent={
            currency.ledgerIds.length > 0 ? (
              <CryptoIcon ledgerId={currency.ledgerIds[0]} ticker={currency.ticker} size={32} />
            ) : (
              <img width="32px" height="32px" src={currency.image} alt={currency.name} />
            )
          }
          title={currency.name}
          description={
            <span className="flex items-center gap-6">
              {ticker}
              {currency.marketcapRank ? (
                <Tag size="sm" appearance="gray" label={`#${currency.marketcapRank}`} />
              ) : null}
            </span>
          }
        />
      </TableCell>

      <TableCell align="end" className={MARKET_CELL_CLASSNAME} data-testid="market-coin-price">
        {formattedPrice}
      </TableCell>

      <TableCell align="end" className={MARKET_CELL_CLASSNAME} data-testid="market-volume">
        {formattedVolume}
      </TableCell>

      <TableCell align="end" className={MARKET_CELL_CLASSNAME} data-testid="market-cap">
        {formattedMarketCap}
      </TableCell>

      <TableCell align="end" className={MARKET_CELL_CLASSNAME} data-testid="market-price-change">
        {priceChangePercentage != null ? <Trend value={priceChangePercentage} /> : "-"}
      </TableCell>

      <TableCell align="end" className={MARKET_CELL_CLASSNAME}>
        <MarketRowActions
          ticker={currency.ticker}
          swapAction={swapAction}
          buySellAction={buySellAction}
          earnAction={earnAction}
          isStarred={isStarred}
          onFavouriteSelect={onFavouriteSelect}
          onMenuOpenChange={onMenuOpenChange}
          t={t}
        />
      </TableCell>
    </TableRow>
  );
});
