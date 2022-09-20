// @flow
import React from "react";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ArrowsUpDown from "~/renderer/icons/ArrowsUpDown";
import styled from "styled-components";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import FromRow from "./FromRow";
import ToRow from "./ToRow";
import type {
  SwapSelectorStateType,
  SwapTransactionType,
  SwapDataType,
} from "@ledgerhq/live-common/exchange/swap/types";

type FormInputsProps = {
  fromAccount: $PropertyType<SwapSelectorStateType, "account">,
  toAccount: $PropertyType<SwapSelectorStateType, "account">,
  fromAmount: $PropertyType<SwapSelectorStateType, "amount">,
  toCurrency: $PropertyType<SwapSelectorStateType, "currency">,
  toAmount: $PropertyType<SwapSelectorStateType, "amount">,
  setFromAccount: $PropertyType<SwapTransactionType, "setFromAccount">,
  setFromAmount: $PropertyType<SwapTransactionType, "setFromAmount">,
  setToAccount: $PropertyType<SwapTransactionType, "setToAccount">,
  setToCurrency: $PropertyType<SwapTransactionType, "setToCurrency">,
  toggleMax: $PropertyType<SwapTransactionType, "toggleMax">,
  reverseSwap: $PropertyType<SwapTransactionType, "reverseSwap">,
  isMaxEnabled?: boolean,
  fromAmountError?: Error,
  isSwapReversable: boolean,
  provider: ?string,
  loadingRates: boolean,
  isSendMaxLoading: boolean,
  updateSelectedRate: $PropertyType<SwapDataType, "updateSelectedRate">,
};

const RoundButton = styled(Button)`
  padding: 8px;
  border-radius: 9999px;
  height: initial;
`;

const Main: ThemedComponent<{}> = styled.section`
  display: flex;
  flex-direction: column;
  row-gap: 12px;
  margin-bottom: 5px;
`;

type SwapButtonProps = {
  onClick: $PropertyType<SwapTransactionType, "reverseSwap">,
  disabled: boolean,
};
function SwapButton({ onClick, disabled }: SwapButtonProps): React$Node {
  return (
    <RoundButton lighterPrimary disabled={disabled} onClick={onClick}>
      <ArrowsUpDown size={14} />
    </RoundButton>
  );
}

export default function FormInputs({
  fromAccount = null,
  toAccount,
  fromAmount = null,
  isMaxEnabled = false,
  setFromAccount,
  setFromAmount,
  toCurrency,
  toAmount,
  setToAccount,
  setToCurrency,
  toggleMax,
  fromAmountError,
  reverseSwap,
  isSwapReversable,
  provider,
  loadingRates,
  isSendMaxLoading,
  updateSelectedRate,
}: FormInputsProps) {
  return (
    <Main>
      <Box>
        <FromRow
          fromAccount={fromAccount}
          setFromAccount={setFromAccount}
          fromAmount={fromAmount}
          setFromAmount={setFromAmount}
          isMaxEnabled={isMaxEnabled}
          toggleMax={toggleMax}
          fromAmountError={fromAmountError}
          provider={provider}
          isSendMaxLoading={isSendMaxLoading}
          updateSelectedRate={updateSelectedRate}
        />
      </Box>
      <Box horizontal justifyContent="center" alignContent="center">
        <SwapButton disabled={!isSwapReversable} onClick={reverseSwap} />
      </Box>
      <Box style={{ marginTop: "-23px" }}>
        <ToRow
          toCurrency={toCurrency}
          setToAccount={setToAccount}
          setToCurrency={setToCurrency}
          toAmount={toAmount}
          fromAccount={fromAccount}
          provider={provider}
          toAccount={toAccount}
          loadingRates={loadingRates}
          updateSelectedRate={updateSelectedRate}
        />
      </Box>
    </Main>
  );
}
