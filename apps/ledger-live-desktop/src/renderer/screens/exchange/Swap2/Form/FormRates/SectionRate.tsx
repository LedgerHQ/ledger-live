import {
  RatesReducerState,
  SwapSelectorStateType,
} from "@ledgerhq/live-common/exchange/swap/types";
import React from "react";
import Rates from "../Rates";
import ProvidersSection from "./ProvidersSection";

export type SectionRateProps = {
  provider?: string;
  ratesState: RatesReducerState;
  fromCurrency: SwapSelectorStateType["currency"];
  toCurrency: SwapSelectorStateType["currency"];
  countdownSecondsToRefresh: number | undefined;
};

const SectionRate = ({
  provider,
  fromCurrency,
  toCurrency,
  ratesState,
  countdownSecondsToRefresh,
}: SectionRateProps) => {
  const rates = ratesState.value;

  return (
    <ProvidersSection>
      <Rates
        {...{
          fromCurrency,
          toCurrency,
          rates,
          provider,
          countdownSecondsToRefresh,
        }}
      />
    </ProvidersSection>
  );
};
export default React.memo<SectionRateProps>(SectionRate);
