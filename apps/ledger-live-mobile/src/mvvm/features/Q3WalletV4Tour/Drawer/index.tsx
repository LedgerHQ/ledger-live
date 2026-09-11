import React from "react";
import { useFeature } from "@features/platform-feature-flags";
import {
  WalletV4TourDrawer,
  type WalletV4TourDrawerViewModel,
} from "LLM/components/WalletV4TourDrawer";
import { useQ3WalletV4TourDrawerViewModel } from "./hooks/useQ3WalletV4TourDrawerViewModel";
import { getQ3WalletV4Tour } from "./const";

export const useQ3WalletV4TourDrawer = () => useQ3WalletV4TourDrawerViewModel();

type Q3WalletV4TourDrawerProps = Omit<WalletV4TourDrawerViewModel, "handleOpenDrawer"> & {
  readonly source?: string;
};

export const Q3WalletV4TourDrawer = (props: Q3WalletV4TourDrawerProps) => {
  const releaseTour = useFeature("releaseTour");
  const tour = getQ3WalletV4Tour(releaseTour?.params?.variant);

  return <WalletV4TourDrawer tour={tour} {...props} />;
};
