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
  updateSelection: () => void,
  refreshTime: number,
  countdown: boolean,
};

const SectionRate = ({
  provider,
  fromCurrency,
  toCurrency,
  ratesState,
  updateSelection,
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
          updateSelection,
          refreshTime,
          countdown,
        }}
      />
    </ProvidersSection>
  );
};

export default React.memo<SectionRateProps>(SectionRate);
