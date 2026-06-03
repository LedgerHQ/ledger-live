import React from "react";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useFooterViewModel } from "./useFooterViewModel";
import { FooterView } from "./FooterView";

type Props = Readonly<{
  currency: AssetDetailCurrencyProps;
  ledgerIds?: string[];
}>;

export function Footer({ currency, ledgerIds }: Props) {
  const viewModel = useFooterViewModel(currency, ledgerIds);
  return <FooterView {...viewModel} />;
}
