// @flow
import type { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

import SectionRate from "./SectionRate";

const Form: ThemedComponent<{}> = styled.section.attrs(({ ready }) => ({
  style: ready ? { opacity: 1, maxHeight: "100vh", overflow: "visible" } : {},
}))`
  display: grid;
  row-gap: 1.375rem;
  color: white;
  transition: max-height 800ms cubic-bezier(0.47, 0, 0.75, 0.72),
    opacity 400ms 400ms cubic-bezier(0.47, 0, 0.75, 0.72);
  transform-origin: top;
  height: auto;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
`;

type SwapFormProvidersProps = {
  swap: SwapTransactionType,
  provider?: string,
  refreshTime: number,
  countdown: boolean,
};
const SwapFormProviders = ({ swap, provider, refreshTime, countdown }: SwapFormProvidersProps) => {
  const { currency: fromCurrency } = swap.from;
  const { currency: toCurrency } = swap.to;
  const ratesState = swap.rates;
  const hasRates = ratesState?.value?.length > 0;

  const [hasFetchedRates, setHasFetchedRates] = useState(hasRates);

  useEffect(() => setHasFetchedRates(v => (!v ? hasRates : v)), [hasRates]);
  return (
    <Form ready={hasFetchedRates}>
      <SectionRate
        provider={provider}
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        ratesState={ratesState}
        refreshTime={refreshTime}
        countdown={countdown}
      />
    </Form>
  );
};

export default React.memo<SwapFormProvidersProps>(SwapFormProviders);
