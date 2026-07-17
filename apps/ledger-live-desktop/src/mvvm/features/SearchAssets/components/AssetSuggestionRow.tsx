import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Trend,
} from "@ledgerhq/lumen-ui-react";
import { MarketCurrencyData, KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import type { AssetNavigationMarketState } from "LLD/features/Assets/types";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { roundFiatPrice } from "@ledgerhq/live-currency-format";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";

export type AssetSuggestionRowDensity = "compact" | "default";

const ICON_SIZE = {
  compact: 24,
  default: 48,
} as const satisfies Record<AssetSuggestionRowDensity, number>;

type AssetSuggestionRowProps = {
  currency: MarketCurrencyData;
  locale: string;
  testIdPrefix: string;
  onClick: (currencyId: string, marketState?: AssetNavigationMarketState) => void;
  density?: AssetSuggestionRowDensity;
};

export function AssetSuggestionRow({
  currency,
  locale,
  testIdPrefix,
  onClick,
  density = "compact",
}: Readonly<AssetSuggestionRowProps>) {
  const counterValueUnit = useSelector(counterValueCurrencySelector).units[0];
  const resolvedLocale = useSelector(localeSelector);
  const priceChange = currency.priceChangePercentage[KeysPriceChange.day];
  const isExpanded = density === "default";
  const iconSize = ICON_SIZE[density];

  const formattedPrice = counterValueFormatter({
    value: roundFiatPrice(currency.price ?? 0),
    unit: counterValueUnit,
    locale: resolvedLocale || locale,
  });

  const trailing = (
    <>
      <ListItemTitle>{formattedPrice}</ListItemTitle>
      {priceChange && (
        <Trend
          value={priceChange}
          size={isExpanded ? "sm" : "md"}
          className={isExpanded ? "self-end" : undefined}
        />
      )}
    </>
  );

  return (
    <ListItem
      density={isExpanded ? "expanded" : "compact"}
      className="cursor-pointer"
      onClick={() => onClick(currency.id, currency)}
      aria-label={currency.name}
      data-testid={`${testIdPrefix}-item-${currency.ticker.toLowerCase()}`}
    >
      <ListItemLeading>
        {currency.ledgerIds?.length && currency.ticker ? (
          <CryptoIcon ledgerId={currency.ledgerIds[0]} ticker={currency.ticker} size={iconSize} />
        ) : (
          <img width={iconSize} height={iconSize} src={currency.image} alt={currency.name} />
        )}
        <ListItemContent>
          <ListItemTitle>{currency.name}</ListItemTitle>
          {isExpanded ? <ListItemDescription>{currency.ticker}</ListItemDescription> : null}
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        {isExpanded ? (
          <ListItemContent>{trailing}</ListItemContent>
        ) : (
          <div className="flex items-center gap-8">{trailing}</div>
        )}
      </ListItemTrailing>
    </ListItem>
  );
}
