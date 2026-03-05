import React, { memo } from "react";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";

const ICON_SIZE = "16px";

const LEFT_CLASSES = [
  "left-0",
  "left-[14.5px]",
  "left-[29px]",
  "left-[43.5px]",
  "left-[58px]",
  "left-[72.5px]",
  "left-[87px]",
  "left-[101.5px]",
  "left-[116px]",
  "left-[130.5px]",
] as const;

export const IconsList = memo(function IconsList({
  currencies,
}: {
  currencies: (CryptoCurrency | TokenCurrency)[];
}) {
  if (currencies.length === 0) return null;
  return (
    <div className="relative h-[18px] w-8">
      {currencies.map((currency, index) => (
        <div
          key={`${currency.id}-${index}`}
          className={`absolute box-border size-[18px] border border-(--color-background-base) ${LEFT_CLASSES[Math.min(index, LEFT_CLASSES.length - 1)]}`}
        >
          <SquaredCryptoIcon
            size={ICON_SIZE}
            ledgerId={currency.id}
            ticker={currency.ticker}
            {...(currency.type === "TokenCurrency" && {
              network: currency.parentCurrency.id,
            })}
          />
        </div>
      ))}
    </div>
  );
});
