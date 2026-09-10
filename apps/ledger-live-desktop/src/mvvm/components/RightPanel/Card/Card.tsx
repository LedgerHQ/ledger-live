import React from "react";
import { CardNumbersUnlockDialog } from "./CardNumbersUnlockDialog";
import { CardView } from "./CardView";
import { useCardViewModel } from "./useCardViewModel";

export const Card = () => {
  const viewModel = useCardViewModel();

  return (
    <>
      <CardView viewModel={viewModel} />
      <CardNumbersUnlockDialog {...viewModel.unlockDialog} />
    </>
  );
};
