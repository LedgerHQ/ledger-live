import React from "react";
import { MarketScreenView } from "./MarketScreenView";
import { useMarketScreenViewModel } from "./useMarketScreenViewModel";

const MarketScreen = () => <MarketScreenView {...useMarketScreenViewModel()} />;

export default MarketScreen;
