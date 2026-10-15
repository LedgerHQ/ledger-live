import type { ComponentType } from "react";
import type { FearAndGreedIndex } from "@domain/entity-market-index-fear-and-greed";

export type GaugeProps = {
  value: number;
  startColor: string;
  endColor: string;
};

export type GaugeComponent = ComponentType<GaugeProps>;

export type FearAndGreedAppearance = "compact" | "expanded";

export type FearAndGreedViewModel = {
  data: FearAndGreedIndex | undefined;
  isLoading: boolean;
  isError: boolean;
  isDefinitionOpen: boolean;
  onOpenDefinition: () => void;
  onCloseDefinition: () => void;
};

export type FearAndGreedViewProps = FearAndGreedViewModel & {
  Gauge: GaugeComponent;
  appearance?: FearAndGreedAppearance;
  width?: number;
};
