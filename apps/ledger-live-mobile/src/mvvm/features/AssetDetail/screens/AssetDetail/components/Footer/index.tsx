import React from "react";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useFooterViewModel } from "./useFooterViewModel";
import { FooterView } from "./FooterView";

type Props = Readonly<{
  currency: AssetDetailCurrencyProps;
}>;

export function Footer({ currency }: Props) {
  const viewModel = useFooterViewModel(currency);
  return <FooterView {...viewModel} />;
}
