import React from "react";
import { FEAR_GAUGE_COLOR, GREED_GAUGE_COLOR } from "../../constants";
import type { GaugeComponent } from "../../types";

type IndicatorProps = Readonly<{
  value: number;
  Gauge: GaugeComponent;
}>;

export function Indicator({ value, Gauge }: IndicatorProps) {
  return <Gauge value={value} startColor={FEAR_GAUGE_COLOR} endColor={GREED_GAUGE_COLOR} />;
}
