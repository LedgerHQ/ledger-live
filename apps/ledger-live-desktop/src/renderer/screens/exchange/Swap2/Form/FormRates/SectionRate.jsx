// @flow
import type {
  RatesReducerState,
  SwapSelectorStateType,
  SwapDataType,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import type { KYCStatus } from "@ledgerhq/live-common/exchange/swap/utils/index";
import React from "react";
import Rates from "../Rates";
import ProvidersSection from "./ProvidersSection";
import ProvidersValue, { NoValuePlaceholder } from "./ProvidersValue";

export type SectionProviderProps = {
  provider?: string,
  status?: KYCStatus,
  ratesState: RatesReducerState,
  fromCurrency: $PropertyType<SwapSelectorStateType, "currency">,
  toCurrency: $PropertyType<SwapSelectorStateType, "currency">,
  updateSelectedRate: $PropertyType<SwapDataType, "updateSelectedRate">,
  refreshTime: number,
};

const SectionProvider = ({
  provider,
  status,
  fromCurrency,
  toCurrency,
  ratesState,
  updateSelectedRate,
  refreshTime,
}: SectionProviderProps) => {
  const rates = ratesState.value;

  return (
    <ProvidersSection>
      {(provider && (
        <Rates
          {...{
            fromCurrency,
            toCurrency,
            rates,
            provider,
            updateSelectedRate,
            refreshTime,
          }}
        />
      )) || (
        <ProvidersValue>
          <NoValuePlaceholder />
        </ProvidersValue>
      )}
    </ProvidersSection>
  );
};

export default React.memo<SectionProviderProps>(SectionProvider);
