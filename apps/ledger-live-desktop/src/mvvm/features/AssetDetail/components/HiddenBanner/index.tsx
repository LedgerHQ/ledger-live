import React from "react";
import type { UseHiddenBannerViewModelProps } from "./useHiddenBannerViewModel";
import { useHiddenBannerViewModel } from "./useHiddenBannerViewModel";
import { HiddenBannerView } from "./HiddenBannerView";

export function HiddenBanner(props: UseHiddenBannerViewModelProps) {
  const viewModel = useHiddenBannerViewModel(props);
  return <HiddenBannerView viewModel={viewModel} />;
}
