import React, { useMemo } from "react";
import styled from "styled-components";
import SectionRate from "./SectionRate";
import { SwapDataType } from "@ledgerhq/live-common/exchange/swap/types";
import { useSwapContext } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";

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

const SwapFormProviders = ({ provider, refreshTime, countdown }: SwapFormProvidersProps) => {
  const { fromCurrencyAccount, toCurrency, rates } = useSwapContext();

  const fromCurrency = fromCurrencyAccount ? getAccountCurrency(fromCurrencyAccount) : undefined;

  return (
    <Form>
      <SectionRate
        provider={provider}
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        ratesState={rates}
        refreshTime={refreshTime}
        countdown={countdown}
      />
    </Form>
  );
};
export default React.memo<SwapFormProvidersProps>(SwapFormProviders);
