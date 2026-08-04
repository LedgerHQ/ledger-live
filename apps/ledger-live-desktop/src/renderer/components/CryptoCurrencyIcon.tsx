import React from "react";
import { Currency } from "@domain/entity-currency";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";

type Props = {
  currency: Currency;
  size: number;
};

const CryptoCurrencyIcon = ({ currency, size }: Props) => {
  if (currency.type === "FiatCurrency") {
    return null;
  }

  const ledgerId = currency.id;
  const ticker = currency.ticker;
  const iconSize = size;
  const validSize = getValidCryptoIconSize(iconSize);

  return (
    <CryptoIcon
      ledgerId={ledgerId}
      ticker={ticker}
      size={validSize}
      network={currency.type === "TokenCurrency" ? currency.parentCurrencyId : undefined}
    />
  );
};

export default CryptoCurrencyIcon;
