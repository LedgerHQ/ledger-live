import React from "react";
import {
  WalletV4TourDrawer,
  type WalletV4TourDrawerViewModel,
} from "LLM/components/WalletV4TourDrawer";
import { useQ3WalletV4TourDrawerViewModel } from "./hooks/useQ3WalletV4TourDrawerViewModel";
import { Q3_WALLET_V4_TOUR } from "./const";

export const useQ3WalletV4TourDrawer = () => useQ3WalletV4TourDrawerViewModel();

type Q3WalletV4TourDrawerProps = Omit<WalletV4TourDrawerViewModel, "handleOpenDrawer"> & {
  readonly source?: string;
};

export const Q3WalletV4TourDrawer = (props: Q3WalletV4TourDrawerProps) => (
  <WalletV4TourDrawer tour={Q3_WALLET_V4_TOUR} {...props} />
);
