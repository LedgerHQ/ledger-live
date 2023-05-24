import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import SectionFees from "./SectionFees";
import SectionTarget from "./SectionTarget";
const Form = styled.section.attrs<{ ready?: boolean }>(({ ready }) => ({
  style: ready
    ? {
        opacity: 1,
        maxHeight: "100vh",
        overflow: "auto",
      }
    : {},
}))<{ ready?: boolean }>`
  display: grid;
  row-gap: 1.25rem;
  color: white;
  transition: max-height 800ms cubic-bezier(0.47, 0, 0.75, 0.72),
    opacity 400ms 400ms cubic-bezier(0.47, 0, 0.75, 0.72);
  transform-origin: top;
  height: auto;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
`;
type SwapFormSummaryProps = {
  swapTransaction: SwapTransactionType;
  provider?: string;
};
const SwapFormSummary = ({ swapTransaction, provider }: SwapFormSummaryProps) => {
  const {
    transaction,
    status,
    updateTransaction,
    setTransaction,
    setToAccount,
    swap: { targetAccounts },
  } = swapTransaction;
  const {
    currency: fromCurrency,
    account: fromAccount,
    parentAccount: fromParentAccount,
  } = swapTransaction.swap.from;
  const { currency: toCurrency, account: toAccount } = swapTransaction.swap.to;
  const ratesState = swapTransaction.swap.rates;
  const hasRates = ratesState?.value?.length && ratesState?.value?.length > 0;
  const [hasFetchedRates, setHasFetchedRates] = useState(hasRates);
  useEffect(() => setHasFetchedRates(v => (!v ? hasRates : v)), [hasRates]);
  return (
    <Form ready={!!hasFetchedRates}>
      <SectionTarget
        account={toAccount}
        currency={toCurrency}
        setToAccount={setToAccount}
        targetAccounts={targetAccounts}
        hasRates={!!hasRates}
      />
      <SectionFees
        transaction={transaction}
        account={fromAccount}
        parentAccount={fromParentAccount}
        currency={fromCurrency}
        status={status}
        updateTransaction={updateTransaction}
        setTransaction={setTransaction}
        provider={provider}
        hasRates={!!hasRates}
      />
    </Form>
  );
};
export default React.memo<SwapFormSummaryProps>(SwapFormSummary);
