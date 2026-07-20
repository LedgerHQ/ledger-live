import React from "react";
import { useCardLoginViewModel } from "../../components/CardLogin/useCardLoginViewModel";
import { CardScreenView } from "./CardScreenView.web";
import { useCardScreenViewModel } from "./useCardScreenViewModel";

export function CardScreen() {
  const cardScreenViewModel = useCardScreenViewModel();
  const cardLoginViewModel = useCardLoginViewModel();

  return <CardScreenView {...cardScreenViewModel} cardLogin={cardLoginViewModel} />;
}
