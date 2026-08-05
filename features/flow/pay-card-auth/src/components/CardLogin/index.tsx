import React from "react";
import { CardLoginView } from "./CardLoginView.web";
import type { CardLoginProps } from "./types";
import { useCardLoginViewModel } from "./useCardLoginViewModel";

export function CardLogin(props: CardLoginProps) {
  return <CardLoginView {...useCardLoginViewModel(props)} />;
}

export type { CardLoginProps, OpenHostedLogin } from "./types";
