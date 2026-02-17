import React from "react";
import { useCardViewModel } from "./hooks/useCardViewModel";
import { CardView } from "./CardView";

const CardPage = () => {
  const viewModel = useCardViewModel();

  return <CardView {...viewModel} />;
};

export default CardPage;
