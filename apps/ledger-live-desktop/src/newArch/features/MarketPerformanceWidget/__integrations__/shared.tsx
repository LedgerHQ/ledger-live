import React from "react";
import { Switch, Route, withRouter } from "react-router";
import MarketPerformanceWidget from "..";
import { ABTestingVariants } from "@ledgerhq/types-live";
import MarketCoin from "~/renderer/screens/market/MarketCoin";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";

export const FAKE_LIST: MarketItemPerformer[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    ticker: "BTC",
    priceChangePercentage1h: 0.5,
    priceChangePercentage24h: 2.3,
    priceChangePercentage7d: 5.1,
    priceChangePercentage30d: 15.8,
    priceChangePercentage1y: 120.7,
    image: "https://path-to-bitcoin-image.com",
    price: 35000,
    ledgerIds: ["bitcoin"],
  },
  {
    id: "ethereum",
    name: "Ethereum",
    ticker: "ETH",
    priceChangePercentage1h: 0.3,
    priceChangePercentage24h: 1.7,
    priceChangePercentage7d: 3.9,
    priceChangePercentage30d: 10.5,
    priceChangePercentage1y: 85.3,
    image: "https://path-to-ethereum-image.com",
    price: 2500,
    ledgerIds: ["ethereum"],
  },
  {
    id: "ripple",
    name: "Ripple",
    ticker: "XRP",
    priceChangePercentage1h: 0.1,
    priceChangePercentage24h: 0.9,
    priceChangePercentage7d: 2.8,
    priceChangePercentage30d: 5.6,
    priceChangePercentage1y: 50.2,
    image: "https://path-to-ripple-image.com",
    price: 1.2,
    ledgerIds: ["ripple"],
  },
];

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
