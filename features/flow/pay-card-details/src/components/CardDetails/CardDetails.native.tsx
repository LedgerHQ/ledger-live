import React from "react";
import { CardDetailsView } from "./CardDetailsView";
import { useCardDetailsViewModel } from "./useCardDetailsViewModel";
import type { CardDetailsProps } from "../../types";

export function CardDetails(props: CardDetailsProps) {
  return <CardDetailsView {...useCardDetailsViewModel(props)} />;
}
