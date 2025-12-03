import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";

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
