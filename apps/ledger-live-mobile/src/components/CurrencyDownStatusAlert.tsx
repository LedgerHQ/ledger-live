import React from "react";
import type { TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import WarningBanner from "./WarningBanner";

type Props = {
  currencies: Array<CryptoCurrency | TokenCurrency>;
};
class StratisDown2021Warning extends Error {
  override name = "StratisDown2021Warning";
  constructor(message = "StratisDown2021Warning") {
    super(message);
  }
}

const CurrencyDownStatusAlert = ({ currencies }: Props) => {
  const errors = [];
  if (currencies.some(c => c.id === "stratis")) errors.push(new StratisDown2021Warning());
  return errors.length > 0 ? (
    <>
      {errors.map((e, i) => (
        <WarningBanner key={i} error={e} />
      ))}
    </>
  ) : null;
};

export default CurrencyDownStatusAlert;
