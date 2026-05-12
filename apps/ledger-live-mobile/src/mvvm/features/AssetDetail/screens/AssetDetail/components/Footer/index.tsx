import React from "react";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useFooterViewModel } from "./useFooterViewModel";
import { FooterView } from "./FooterView";

export function Footer({ currency }: Readonly<{ currency: AssetDetailCurrencyProps }>) {
  const viewModel = useFooterViewModel(currency);
  return <FooterView {...viewModel} />;
}
