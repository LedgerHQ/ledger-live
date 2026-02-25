import React from "react";
import {
  useWalletV4TourDrawerViewModel,
  WalletV4TourDialog,
} from "LLD/features/WalletV4Tour/Drawer";
import { usePortfolioViewModel } from "./hooks/usePortfolioViewModel";
import { PortfolioView } from "./PortfolioView";

const Portfolio = () => {
  const viewModel = usePortfolioViewModel();
  const { isDialogOpen: isWalletV4TourOpen, handleCloseDialog: handleCloseWalletV4Tour } =
    useWalletV4TourDrawerViewModel({ isOnPortfolioPage: true });

  return (
    <>
      <PortfolioView {...viewModel} />
      <WalletV4TourDialog isOpen={isWalletV4TourOpen} onClose={handleCloseWalletV4Tour} />
    </>
  );
};

export default Portfolio;
