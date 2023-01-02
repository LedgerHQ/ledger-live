// @flow
import type {
  RatesReducerState,
  SwapSelectorStateType,
} from "@ledgerhq/live-common/exchange/swap/types";
import React from "react";
import Rates from "../Rates";
import ProvidersSection from "./ProvidersSection";

export type SectionRateProps = {
  provider?: string,
  ratesState: RatesReducerState,
  fromCurrency: $PropertyType<SwapSelectorStateType, "currency">,
  toCurrency: $PropertyType<SwapSelectorStateType, "currency">,
  refreshTime: number,
  countdown: boolean,
};

const SectionRate = ({
  provider,
  fromCurrency,
  toCurrency,
  ratesState,
  refreshTime,
  countdown,
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
          refreshTime,
          countdown,
        }}
      />
    </ProvidersSection>
  );
};

export default React.memo<SectionRateProps>(SectionRate);
