import React from "react";
import { Switch, Route, withRouter } from "react-router";
import MarketPerformanceWidget from "..";
import { ABTestingVariants } from "@ledgerhq/types-live";
import MarketCoin from "~/renderer/screens/market/MarketCoin";
import { MOCK_MARKET_PERFORMERS } from "@ledgerhq/live-common/market/utils/fixtures";

// Use first 3 items from shared fixtures for backward compatibility
export const FAKE_LIST = MOCK_MARKET_PERFORMERS.slice(0, 3);

const MarketWidgetNavigation = () => (
  <Switch>
    <Route
      exact
      path="/"
      render={() => <MarketPerformanceWidget variant={ABTestingVariants.variantA} />}
    />
    <Route path="/market/:currencyId" render={() => <MarketCoin />} />
  </Switch>
);

const MarketWidgetTestBase = () => <MarketWidgetNavigation />;

export const MarketWidgetTest = withRouter(MarketWidgetTestBase);
