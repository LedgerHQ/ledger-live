import React from "react";
import { CardLoginView } from "./CardLoginView.native";
import type { CardLoginProps } from "./types";
import { useCardLoginViewModel } from "./useCardLoginViewModel";

export function CardLogin(props: CardLoginProps) {
  return <CardLoginView {...useCardLoginViewModel(props)} />;
}
