import React from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import HeaderTitle from "LLM/components/Navigation/HeaderTitle";
import HeaderBackButton from "LLM/components/Navigation/HeaderBackButton";

export function MarketListHeaderLeft() {
  const { shouldDisplayMarketBanner } = useWalletFeaturesConfig("mobile");

  if (!shouldDisplayMarketBanner) {
    return null;
  }

  return <HeaderBackButton testID="market-list-header-left" />;
}

export function MarketListHeaderTitle() {
  const { shouldDisplayMarketBanner } = useWalletFeaturesConfig("mobile");

  if (!shouldDisplayMarketBanner) {
    return null;
  }

  return <HeaderTitle titleKey="market.title" />;
}
