import React from "react";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useFooterViewModel } from "./useFooterViewModel";
import { FooterView } from "./FooterView";

type Props = Readonly<{
  currency: CryptoCurrency | undefined;
}>;

export function Footer({ currency }: Props) {
  const viewModel = useFooterViewModel(currency);
  return <FooterView {...viewModel} />;
}
