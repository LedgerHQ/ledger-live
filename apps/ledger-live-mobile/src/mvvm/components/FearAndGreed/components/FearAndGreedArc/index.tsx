import React from "react";
import ArcGaugeIndicator from "LLM/components/ArcGaugeIndicator";
import type { FearAndGreedAppearance } from "../../types";

const FEAR_COLOR = "#F87274";
const GREED_COLOR = "#6EC85C";

type Props = Readonly<{
  value: number;
  appearance?: FearAndGreedAppearance;
}>;

export default function FearAndGreedArc({ value, appearance = "compact" }: Props) {
  return (
    <ArcGaugeIndicator
      value={value}
      appearance={appearance}
      startColor={FEAR_COLOR}
      endColor={GREED_COLOR}
    />
  );
}
