import React from "react";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { PerpsAccountBannerView } from "./PerpsAccountBannerView";
import { usePerpsAccountBannerViewModel } from "./usePerpsAccountBannerViewModel";

type Props = Readonly<{
  currency: CryptoCurrency;
}>;

export function PerpsAccountBanner({ currency }: Props) {
  return <PerpsAccountBannerView {...usePerpsAccountBannerViewModel(currency)} />;
}
