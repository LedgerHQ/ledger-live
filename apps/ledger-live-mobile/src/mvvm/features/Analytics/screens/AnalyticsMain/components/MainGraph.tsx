import React from "react";
import PortfolioGraphCard from "~/screens/Portfolio/PortfolioGraphCard";
import { useShouldDisplayAnalyticsPnl } from "LLM/features/Analytics/hooks/useShouldDisplayAnalyticsPnl";
import { ANALYTICS_PAGE } from "../../../const";
import ChartSection from "./ChartSection";

const MainGraph: React.FC = () => {
  const shouldDisplayPnl = useShouldDisplayAnalyticsPnl();

  if (shouldDisplayPnl) {
    return <ChartSection />;
  }

  return <PortfolioGraphCard showAssets={true} screenName={ANALYTICS_PAGE} />;
};

export default React.memo(MainGraph);
