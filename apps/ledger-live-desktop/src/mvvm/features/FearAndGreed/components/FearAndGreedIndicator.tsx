import React from "react";
import { ArcGaugeIndicator } from "LLD/components/ArcGaugeIndicator";

const FEAR_COLOR = "#F87274";
const GREED_COLOR = "#6EC85C";

export const FearAndGreedIndicator = ({ value }: { value: number }) => (
  <ArcGaugeIndicator value={value} startColor={FEAR_COLOR} endColor={GREED_COLOR} />
);
