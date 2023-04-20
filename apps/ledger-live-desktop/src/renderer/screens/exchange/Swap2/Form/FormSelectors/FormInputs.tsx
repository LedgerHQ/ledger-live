import React from "react";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ArrowsUpDown from "~/renderer/icons/ArrowsUpDown";
import styled from "styled-components";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { track } from "~/renderer/analytics/segment";
import FromRow from "./FromRow";
import ToRow from "./ToRow";
import {
  SwapSelectorStateType,
  SwapTransactionType,
  SwapDataType,
} from "@ledgerhq/live-common/exchange/swap/types";
import { useGetSwapTrackingProperties } from "../../utils/index";
type FormInputsProps = {
  fromAccount: SwapSelectorStateType["account"];
  toAccount: SwapSelectorStateType["account"];
  fromAmount: SwapSelectorStateType["amount"];
  toCurrency: SwapSelectorStateType["currency"];
  toAmount: SwapSelectorStateType["amount"];
  setFromAccount: SwapTransactionType["setFromAccount"];
  setFromAmount: SwapTransactionType["setFromAmount"];
  setToAccount: SwapTransactionType["setToAccount"];
  setToCurrency: SwapTransactionType["setToCurrency"];
  toggleMax: SwapTransactionType["toggleMax"];
  reverseSwap: SwapTransactionType["reverseSwap"];
  isMaxEnabled?: boolean;
  fromAmountError?: Error;
  isSwapReversable: boolean;
  provider: string | undefined | null;
  loadingRates: boolean;
  isSendMaxLoading: boolean;
  updateSelectedRate: SwapDataType["updateSelectedRate"];
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
  onClick: SwapTransactionType["reverseSwap"];
  disabled: boolean;
};
function SwapButton({ onClick, disabled }: SwapButtonProps): React.ReactNode {
  return (
    <RoundButton
      lighterPrimary
      disabled={disabled}
      onClick={onClick}
      data-test-id="swap-reverse-pair-button"
    >
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
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const reverseSwapAndTrack = () => {
    track("button_clicked", {
      button: "switch",
      page: "Page Swap Form",
      ...swapDefaultTrack,
    });
    reverseSwap();
  };
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
        <SwapButton disabled={!isSwapReversable} onClick={reverseSwapAndTrack} />
      </Box>
      <Box
        style={{
          marginTop: "-23px",
        }}
      >
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
