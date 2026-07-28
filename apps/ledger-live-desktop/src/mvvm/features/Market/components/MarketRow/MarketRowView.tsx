import React, { memo } from "react";
import { TFunction } from "i18next";
import {
  TableRow,
  TableCell,
  TableCellItem,
  TableCellContent,
  TableCellContentTitle,
  TableCellContentDescription,
  TableCellContentRow,
  Trend,
  Tag,
  MediaImage,
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { TruncatedText } from "LLD/components/TruncatedText";
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
      <TableCell className={`${MARKET_CELL_CLASSNAME} min-w-0 [&>div]:min-w-0`}>
        <TableCellItem className="overflow-hidden">
          {currency.ledgerIds.length > 0 ? (
            <CryptoIcon ledgerId={currency.ledgerIds[0]} ticker={currency.ticker} size={32} />
          ) : (
            <MediaImage
              src={currency.image}
              alt={currency.name}
              shape="circle"
              size={32}
              fallback={currency.name}
            />
          )}
          <TableCellContent>
            <TableCellContentTitle>
              <TruncatedText text={currency.name} />
            </TableCellContentTitle>
            <TableCellContentRow>
              <TableCellContentDescription>{ticker}</TableCellContentDescription>
              {currency.marketcapRank ? (
                <Tag size="sm" appearance="gray" label={`#${currency.marketcapRank}`} />
              ) : null}
            </TableCellContentRow>
          </TableCellContent>
        </TableCellItem>
      </TableCell>

      <TableCell align="end" className={MARKET_CELL_CLASSNAME} data-testid="market-coin-price">
        <TableCellItem align="end">
          <TableCellContent>
            <TableCellContentTitle>{formattedPrice}</TableCellContentTitle>
          </TableCellContent>
        </TableCellItem>
      </TableCell>

      <TableCell align="end" className={MARKET_CELL_CLASSNAME} data-testid="market-volume">
        <TableCellItem align="end">
          <TableCellContent>
            <TableCellContentTitle>{formattedVolume}</TableCellContentTitle>
          </TableCellContent>
        </TableCellItem>
      </TableCell>

      <TableCell align="end" className={MARKET_CELL_CLASSNAME} data-testid="market-cap">
        <TableCellItem align="end">
          <TableCellContent>
            <TableCellContentTitle>{formattedMarketCap}</TableCellContentTitle>
          </TableCellContent>
        </TableCellItem>
      </TableCell>

      <TableCell align="end" className={MARKET_CELL_CLASSNAME} data-testid="market-price-change">
        {priceChangePercentage == null ? (
          "-"
        ) : Math.abs(priceChangePercentage) < 0.005 ? (
          <span className="body-2 text-muted">0.00%</span>
        ) : (
          <Trend value={priceChangePercentage} />
        )}
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
