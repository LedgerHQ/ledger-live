// @flow
import type { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import React, { useMemo } from "react";
import styled from "styled-components";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

import SectionRate from "./SectionRate";
import { BigNumber } from "bignumber.js";

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
  showNoQuoteDexRate: boolean,
};
const SwapFormProviders = ({
  swap,
  provider,
  refreshTime,
  countdown,
  showNoQuoteDexRate,
}: SwapFormProvidersProps) => {
  const { currency: fromCurrency } = swap.from;
  const { currency: toCurrency } = swap.to;
  const ratesState = swap.rates;

  const updatedRatesState = useMemo(() => {
    if (showNoQuoteDexRate && swap.rates?.value) {
      return {
        ...swap.rates,
        value: swap.rates.value.concat(
          {
            magnitudeAwareRate: BigNumber(0),
            provider: "oneinch",
            providerType: "DEX",
            rate: undefined,
            rateId: undefined,
            toAmount: BigNumber(0),
            tradeMethod: "float",
            payoutNetworkFees: undefined,
          },
          {
            magnitudeAwareRate: BigNumber(0),
            provider: "paraswap",
            providerType: "DEX",
            rate: undefined,
            rateId: undefined,
            toAmount: BigNumber(0),
            tradeMethod: "float",
            payoutNetworkFees: undefined,
          },
        ),
      };
    }
    return swap.rates;
  }, [swap.rates, showNoQuoteDexRate]);
  const hasRates = ratesState?.value?.length > 0;
  const loading = !hasRates && ratesState.status === "loading";

  return (
    <Form ready={true}>
      <SectionRate
        provider={provider}
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        ratesState={updatedRatesState}
        refreshTime={refreshTime}
        countdown={countdown}
        loading={loading}
      />
    </Form>
  );
};

export default React.memo<SwapFormProvidersProps>(SwapFormProviders);
