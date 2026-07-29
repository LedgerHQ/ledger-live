import React from "react";
import { Trend } from "@ledgerhq/lumen-ui-rnative";

type Props = {
  percent: number;
};

export const MarketPercentIndicator = ({ percent }: Props) => <Trend value={percent} size="sm" />;
