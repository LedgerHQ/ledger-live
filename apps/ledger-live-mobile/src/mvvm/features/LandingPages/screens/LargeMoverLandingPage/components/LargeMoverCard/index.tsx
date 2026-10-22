import React from "react";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import {
  KeysPriceChange,
  PartialMarketItemResponse,
} from "@ledgerhq/live-common/market/utils/types";
import { Card } from "../Card";
import type { CoinPicker } from "../Ticker";
import { useLargeMoverCardViewModel } from "./useLargeMoverCardViewModel";

type LargeMoverCardProps = Readonly<{
  ledgerId: string;
  counterCurrency: string;
  isCryptoCountervalue: boolean;
  data: PartialMarketItemResponse;
  currency: CryptoOrTokenCurrency;
  height: number;
  range: KeysPriceChange;
  setRange: (range: KeysPriceChange) => void;
  currentIndex: number;
  coinPicker?: CoinPicker;
}>;

export function LargeMoverCard({
  ledgerId,
  counterCurrency,
  isCryptoCountervalue,
  range,
  ...cardProps
}: LargeMoverCardProps) {
  const { chartData, loading } = useLargeMoverCardViewModel({
    ledgerId,
    counterCurrency,
    range,
    isCryptoCountervalue,
  });

  return <Card {...cardProps} chartData={chartData} loading={loading} range={range} />;
}
