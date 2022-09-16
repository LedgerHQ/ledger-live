// @flow
import type {
  RatesReducerState,
  SwapSelectorStateType,
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
  updateSelection: () => void,
  refreshTime: number,
  countdown: boolean,
  decentralizedSwapAvailable: boolean,
};

const SectionProvider = ({
  provider,
  status,
  fromCurrency,
  toCurrency,
  ratesState,
  updateSelection,
  refreshTime,
  countdown,
  decentralizedSwapAvailable,
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
            updateSelection,
            refreshTime,
            countdown,
            decentralizedSwapAvailable,
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
