import React, { useMemo } from "react";
import styled from "styled-components";
import SectionRate from "./SectionRate";
import { SwapDataType } from "@ledgerhq/live-common/exchange/swap/types";

const Form = styled.section`
  display: grid;
  row-gap: 1.375rem;
  color: white;
`;
type SwapFormProvidersProps = {
  swap: SwapDataType;
  provider?: string;
  refreshTime: number;
  countdown: boolean;
};

const SwapFormProviders = ({ swap, provider, refreshTime, countdown }: SwapFormProvidersProps) => {
  const { currency: fromCurrency } = swap.from;
  const { currency: toCurrency } = swap.to;

  const updatedRatesState = useMemo(() => {
    return swap.rates;
  }, [swap.rates]);

  return (
    <Form>
      <SectionRate
        provider={provider}
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        ratesState={updatedRatesState}
        refreshTime={refreshTime}
        countdown={countdown}
      />
    </Form>
  );
};
export default React.memo<SwapFormProvidersProps>(SwapFormProviders);
