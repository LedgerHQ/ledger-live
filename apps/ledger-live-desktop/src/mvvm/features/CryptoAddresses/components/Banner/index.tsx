import React from "react";
import { CryptoAddressesBannerView } from "./CryptoAddressesBannerView";
import { useCryptoAddressesBannerViewModel } from "./hooks/useCryptoAddressesBannerViewModel";

export const CryptoAddressesBanner = () => {
  return <CryptoAddressesBannerView {...useCryptoAddressesBannerViewModel()} />;
};
