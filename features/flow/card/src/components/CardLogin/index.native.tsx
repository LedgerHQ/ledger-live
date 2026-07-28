import React from "react";
import { usePayCard } from "../../hooks/usePayCard";
import { CardLoginView } from "./CardLoginView.native";
import { useCardLoginViewModel } from "./useCardLoginViewModel";

export function CardLogin() {
  const { openHostedLogin } = usePayCard();

  return <CardLoginView {...useCardLoginViewModel({ openHostedLogin })} />;
}
