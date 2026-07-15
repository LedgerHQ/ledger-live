import React from "react";
import { CardPlayground } from "../../components/CardPlayground";
import type { CardScreenViewModel } from "./useCardScreenViewModel";

type CardScreenViewProps = CardScreenViewModel;

export function CardScreenView({ description, title }: CardScreenViewProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-muted p-16">
      <span className="body-2-semi-bold text-base">{title}</span>
      <span className="body-3 text-muted">{description}</span>
      <CardPlayground />
    </div>
  );
}
