import React from "react";
import ArcGaugeIndicator from "LLM/components/ArcGaugeIndicator";

const FEAR_COLOR = "#F87274";
const GREED_COLOR = "#6EC85C";

type Props = Readonly<{
  value: number;
}>;

export default function FearAndGreedArc({ value }: Props) {
  return <ArcGaugeIndicator value={value} startColor={FEAR_COLOR} endColor={GREED_COLOR} />;
}
