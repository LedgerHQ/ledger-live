import React from "react";
import { Routes, Route } from "react-router";
import MarketPerformanceWidget from "..";
import { ABTestingVariants } from "@ledgerhq/types-live";
import MarketCoin from "~/renderer/screens/market/MarketCoin";
import { MOCK_MARKET_PERFORMERS } from "@ledgerhq/live-common/market/utils/fixtures";

// Use first 3 items from shared fixtures for backward compatibility
export const FAKE_LIST = MOCK_MARKET_PERFORMERS.slice(0, 3);

const MarketWidgetNavigation = () => (
  <Routes>
    <Route path="/" element={<MarketPerformanceWidget variant={ABTestingVariants.variantA} />} />
    <Route path="/market/:currencyId" element={<MarketCoin />} />
  </Routes>
);

export const MarketWidgetTest = () => <MarketWidgetNavigation />;
