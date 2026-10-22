import React from "react";
import { ExpandedCard, ExpandedCardSkeleton, ErrorCard } from "./components/ExpandedCard";
import { Card } from "./components/Card";
import { Definition } from "./components/Definition";
import type { FearAndGreedViewProps } from "./types";

export function FearAndGreedView({
  data,
  isLoading,
  isError,
  isDefinitionOpen,
  onOpenDefinition,
  onCloseDefinition,
  appearance = "compact",
  width,
  Gauge,
}: FearAndGreedViewProps) {
  if (appearance === "expanded" && isLoading) {
    return <ExpandedCardSkeleton width={width} testID="fear-and-greed-card-skeleton" />;
  }

  if (!data || isError) {
    if (appearance === "expanded") {
      return <ErrorCard width={width} testID="fear-and-greed-card-error" />;
    }

    return null;
  }

  return (
    <>
      {appearance === "expanded" ? (
        <ExpandedCard data={data} Gauge={Gauge} width={width} onPress={onOpenDefinition} />
      ) : (
        <Card data={data} Gauge={Gauge} onPress={onOpenDefinition} />
      )}
      <Definition isOpen={isDefinitionOpen} onClose={onCloseDefinition} />
    </>
  );
}
