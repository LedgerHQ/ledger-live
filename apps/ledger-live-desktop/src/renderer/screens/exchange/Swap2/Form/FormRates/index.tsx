import React from "react";
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
  countdownSecondsToRefresh: number | undefined;
  provider?: string;
};

const SwapFormProviders = ({
  swap,
  provider,
  countdownSecondsToRefresh,
}: SwapFormProvidersProps) => {
  const { currency: fromCurrency } = swap.from;
  const { currency: toCurrency } = swap.to;

  return (
    <Form>
      <SectionRate
        provider={provider}
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        ratesState={swap.rates}
        countdownSecondsToRefresh={countdownSecondsToRefresh}
      />
    </Form>
  );
};
export default React.memo<SwapFormProvidersProps>(SwapFormProviders);
