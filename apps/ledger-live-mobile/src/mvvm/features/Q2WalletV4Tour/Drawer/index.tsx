import React from "react";
import {
  WalletV4TourDrawer,
  type WalletV4TourDrawerViewModel,
} from "LLM/components/WalletV4TourDrawer";
import { useQ2WalletV4TourDrawerViewModel } from "./hooks/useQ2WalletV4TourDrawerViewModel";
import { Q2_WALLET_V4_TOUR } from "./const";

export const useQ2WalletV4TourDrawer = () => useQ2WalletV4TourDrawerViewModel();

type Q2WalletV4TourDrawerProps = Omit<WalletV4TourDrawerViewModel, "handleOpenDrawer"> & {
  readonly source?: string;
};

export const Q2WalletV4TourDrawer = (props: Q2WalletV4TourDrawerProps) => (
  <WalletV4TourDrawer tour={Q2_WALLET_V4_TOUR} {...props} />
);
