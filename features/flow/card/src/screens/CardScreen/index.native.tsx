import React from "react";
import { usePayCard } from "../../store/usePayCard";
import { useCardLoginViewModel } from "../../components/CardLogin/useCardLoginViewModel";
import { CardScreenView } from "./CardScreenView.native";
import { useCardScreenViewModel } from "./useCardScreenViewModel";

export function CardScreen() {
  const { openHostedLogin } = usePayCard();
  const cardScreenViewModel = useCardScreenViewModel();
  const cardLoginViewModel = useCardLoginViewModel({ openHostedLogin });

  return <CardScreenView {...cardScreenViewModel} cardLogin={cardLoginViewModel} />;
}
