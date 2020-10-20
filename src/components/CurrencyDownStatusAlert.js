// @flow
import React from "react";
import { createCustomErrorClass } from "@ledgerhq/errors";
import type {
  TokenCurrency,
  CryptoCurrency,
} from "@ledgerhq/live-common/lib/types";
import WarningBanner from "./WarningBanner";

type Props = {
  currencies: Array<CryptoCurrency | TokenCurrency>,
};

const BitcoinCashHardforkOct2020Warning = createCustomErrorClass(
  "BitcoinCashHardforkOct2020Warning",
);

const CurrencyDownStatusAlert = ({ currencies }: Props) => {
  if (currencies.some(c => c.id === "bitcoin_cash")) {
    return <WarningBanner error={new BitcoinCashHardforkOct2020Warning()} />;
  }
  return null;
};

export default CurrencyDownStatusAlert;
