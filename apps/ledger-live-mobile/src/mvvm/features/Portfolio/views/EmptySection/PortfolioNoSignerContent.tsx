import React from "react";
import { NavigatorName } from "~/const";
import TrackScreen from "~/analytics/TrackScreen";
import { TRACKING_LABEL_MAP } from "LLM/components/MainTabBar/constants";
import { WalletAssetsView } from "LLM/features/WalletAssets";

export const PortfolioNoSignerContent = () => (
  <>
    <TrackScreen name={TRACKING_LABEL_MAP[NavigatorName.Portfolio]} />
    <WalletAssetsView hideButton />
  </>
);
