import React from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import CryptoIcon from "@ledgerhq/crypto-icons/native";

type Props = {
  isDisabled?: boolean;
};

const Icon = (_props: Props) => {
  const currency = getCryptoCurrencyById("celo");
  const ledgerId = currency.id;
  const ticker = currency.ticker;
  return <CryptoIcon ledgerId={ledgerId} ticker={ticker} size={20} />;
};

export default Icon;
