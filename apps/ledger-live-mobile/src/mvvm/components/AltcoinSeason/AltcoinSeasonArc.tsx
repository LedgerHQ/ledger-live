import React from "react";
import ArcGaugeIndicator from "LLM/components/ArcGaugeIndicator";

const BITCOIN_COLOR = "#FF9416";
const ALTCOIN_COLOR = "#3F51B5";

type Props = Readonly<{
  value: number;
}>;

export function AltcoinSeasonArc({ value }: Props) {
  return (
    <ArcGaugeIndicator
      value={value}
      appearance="expanded"
      startColor={BITCOIN_COLOR}
      endColor={ALTCOIN_COLOR}
    />
  );
}
