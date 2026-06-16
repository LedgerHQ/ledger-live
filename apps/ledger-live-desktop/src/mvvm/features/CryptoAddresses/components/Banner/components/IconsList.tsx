import React, { memo } from "react";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import useTheme from "~/renderer/hooks/useTheme";

const ICON_SIZE = 16;
const LEFT_STEP_PX = 14.5;

export const IconsList = memo(function IconsList({
  currencies,
}: {
  currencies: (CryptoCurrency | TokenCurrency)[];
}) {
  const theme = useTheme();
  const borderColor = theme.colors.background.card;

  if (currencies.length === 0) return null;
  return (
    <div className="relative h-[18px] w-8">
      {currencies.map((currency, index) => (
        <div
          key={`${currency.id}-${index}`}
          className="absolute box-border size-[18px]"
          style={{
            left: Math.min(index, 9) * LEFT_STEP_PX,
            border: `1px solid ${borderColor}`,
            borderRadius: 4,
          }}
        >
          <SquaredCryptoIcon
            size={ICON_SIZE}
            ledgerId={currency.id}
            ticker={currency.ticker}
            {...(currency.type === "TokenCurrency" && {
              network: currency.parentCurrencyId,
            })}
          />
        </div>
      ))}
    </div>
  );
});
