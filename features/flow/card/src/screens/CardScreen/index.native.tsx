import React from "react";
import { CardScreenView } from "./CardScreenView.native";
import { useCardScreenViewModel } from "./useCardScreenViewModel";

export function CardScreen() {
  return <CardScreenView {...useCardScreenViewModel()} />;
}
