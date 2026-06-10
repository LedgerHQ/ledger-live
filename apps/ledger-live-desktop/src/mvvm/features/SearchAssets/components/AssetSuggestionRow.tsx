import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Trend,
} from "@ledgerhq/lumen-ui-react";
import { MarketCurrencyData, KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { roundFiatPrice } from "@ledgerhq/live-currency-format";

const ICON_SIZE = 24;

type AssetSuggestionRowProps = {
  currency: MarketCurrencyData;
  counterCurrency: string;
  locale: string;
  testIdPrefix: string;
  onClick: (currencyId: string) => void;
};

export function AssetSuggestionRow({
  currency,
  counterCurrency,
  locale,
  testIdPrefix,
  onClick,
}: Readonly<AssetSuggestionRowProps>) {
  const priceChange = currency.priceChangePercentage[KeysPriceChange.day];

  return (
    <ListItem
      density="compact"
      className="cursor-pointer"
      onClick={() => onClick(currency.id)}
      aria-label={currency.name}
      data-testid={`${testIdPrefix}-item-${currency.ticker.toLowerCase()}`}
    >
      <ListItemLeading>
        {currency.ledgerIds?.length && currency.ticker ? (
          <CryptoIcon ledgerId={currency.ledgerIds[0]} ticker={currency.ticker} size={ICON_SIZE} />
        ) : (
          <img width={ICON_SIZE} height={ICON_SIZE} src={currency.image} alt={currency.name} />
        )}
        <ListItemContent>
          <ListItemTitle>{currency.name}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <div className="flex items-center gap-8">
          <ListItemTitle>
            {counterValueFormatter({
              value: roundFiatPrice(currency.price ?? 0),
              currency: counterCurrency,
              locale,
            })}
          </ListItemTitle>
          {priceChange != null ? <Trend value={priceChange} size="md" /> : null}
        </div>
      </ListItemTrailing>
    </ListItem>
  );
}
