import React from "react";
import { useCryptoBannerViewModel } from "./useCryptoBannerViewModel";
import { GetTopCryptosParams } from "../../data-layer/api/types";
import { CryptoBannerView } from "./CryptoBannerView.native";

interface CryptoBannerProps extends GetTopCryptosParams {
  className?: string;
}

export const CryptoBanner = (props: CryptoBannerProps) => {
  const viewModel = useCryptoBannerViewModel({
    product: props.product,
    version: props.version,
    isStaging: props.isStaging,
  });

  return <CryptoBannerView {...viewModel} />;
};
