import React from "react";
import { CardScreenView } from "./CardScreenView.web";
import { useCardScreenViewModel } from "./useCardScreenViewModel";

export function CardScreen() {
  return <CardScreenView {...useCardScreenViewModel()} />;
}
