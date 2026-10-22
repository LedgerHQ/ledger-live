import React, { memo } from "react";
import { Card } from "./components/Card";
import { CardSkeleton } from "./components/Card/CardSkeleton";
import { Definition } from "./components/Definition";
import { ErrorCard, ExpandedCard, ExpandedCardSkeleton } from "./components/ExpandedCard";
import type { FearAndGreedViewProps } from "./types";

function FearAndGreedViewComponent({
  isLoading,
  isError,
  data,
  isDefinitionOpen,
  onOpenDefinition,
  onCloseDefinition,
  appearance = "compact",
  Gauge,
}: FearAndGreedViewProps) {
  if (isLoading) {
    return appearance === "expanded" ? <ExpandedCardSkeleton /> : <CardSkeleton />;
  }

  if (isError || !data) {
    return appearance === "expanded" ? <ErrorCard /> : null;
  }

  return (
    <Definition
      open={isDefinitionOpen}
      onOpenChange={open => (open ? onOpenDefinition() : onCloseDefinition())}
    >
      {appearance === "expanded" ? (
        <ExpandedCard data={data} Gauge={Gauge} onPress={onOpenDefinition} />
      ) : (
        <Card data={data} Gauge={Gauge} onPress={onOpenDefinition} />
      )}
    </Definition>
  );
}

export const FearAndGreedView = memo(FearAndGreedViewComponent);
