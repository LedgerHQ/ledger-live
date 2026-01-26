import React from "react";
import { usePortfolioViewModel } from "./hooks/usePortfolioViewModel";
import { PortfolioView } from "./PortfolioView";

const Portfolio = () => {
  const viewModel = usePortfolioViewModel();

  return <PortfolioView {...viewModel} />;
};

export default Portfolio;
