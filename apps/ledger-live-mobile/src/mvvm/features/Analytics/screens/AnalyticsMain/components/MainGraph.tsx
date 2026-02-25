import React from "react";
import PortfolioGraphCard from "~/screens/Portfolio/PortfolioGraphCard";
import { ANALYTICS_PAGE } from "../../../const";

const MainGraph: React.FC = () => {
  return <PortfolioGraphCard showAssets={true} screenName={ANALYTICS_PAGE} />;
};

export default React.memo(MainGraph);
