import React from "react";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { LocalNodeAccountBannerView } from "./LocalNodeAccountBannerView";
import { useLocalNodeAccountBannerViewModel } from "./useLocalNodeAccountBannerViewModel";

type Props = Readonly<{
  currency: CryptoCurrency;
}>;

/** On the account page of a currency that runs on its local node, and only there. */
export function LocalNodeAccountBanner({ currency }: Props) {
  return <LocalNodeAccountBannerView {...useLocalNodeAccountBannerViewModel(currency)} />;
}
