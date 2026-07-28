import React from "react";
import { CardLoginView } from "./CardLoginView.web";
import { useCardLoginViewModel } from "./useCardLoginViewModel";

export function CardLogin() {
  return <CardLoginView {...useCardLoginViewModel()} />;
}
