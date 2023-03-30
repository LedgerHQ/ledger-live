import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import React, { useMemo } from "react";
import styled from "styled-components";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import SectionRate from "./SectionRate";
import { BigNumber } from "bignumber.js";
const Form: ThemedComponent<{}> = styled.section`
  display: grid;
  row-gap: 1.375rem;
  color: white;
`;
type SwapFormProvidersProps = {
  swap: SwapTransactionType;
  provider?: string;
  refreshTime: number;
  countdown: boolean;
  showNoQuoteDexRate: boolean;
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
