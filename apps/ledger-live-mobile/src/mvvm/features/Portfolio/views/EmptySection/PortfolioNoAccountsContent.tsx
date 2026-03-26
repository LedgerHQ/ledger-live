import React from "react";
import TrackScreen from "~/analytics/TrackScreen";
import { WalletAssetsView } from "LLM/features/WalletAssets";

const PortfolioNoAccountsContent = () => (
  <>
    <TrackScreen name="Wallet" accountsLength={0} />
    <WalletAssetsView isEmptyState />
  </>
);

export default PortfolioNoAccountsContent;
