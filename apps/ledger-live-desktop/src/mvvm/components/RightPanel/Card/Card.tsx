import React from "react";
import { CardView } from "./CardView";
import { useCardViewModel } from "./useCardViewModel";

/**
 * Card
 * Right-panel content for the Pay tab: the Pay Card visual with a mock balance.
 */
export const Card = () => {
  const viewModel = useCardViewModel();

  return <CardView viewModel={viewModel} />;
};
