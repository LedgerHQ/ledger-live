import React from "react";
import { createCustomErrorClass } from "@ledgerhq/errors";
import type {
  TokenCurrency,
  CryptoCurrency,
} from "@ledgerhq/types-cryptoassets";
import WarningBanner from "./WarningBanner";

type Props = {
  currencies: Array<CryptoCurrency | TokenCurrency>;
};
const StratisDown2021Warning = createCustomErrorClass("StratisDown2021Warning");

const CurrencyDownStatusAlert = ({ currencies }: Props) => {
  const errors = [];
  if (currencies.some(c => c.id === "stratis"))
    errors.push(new StratisDown2021Warning());
  return errors.length > 0 ? (
    <>
      {errors.map((e, i) => (
        <WarningBanner key={i} error={e} />
      ))}
    </>
  ) : null;
};

export default CurrencyDownStatusAlert;
