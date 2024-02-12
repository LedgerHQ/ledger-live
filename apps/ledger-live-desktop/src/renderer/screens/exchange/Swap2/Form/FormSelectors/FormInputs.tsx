import React from "react";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ArrowsUpDown from "~/renderer/icons/ArrowsUpDown";
import styled from "styled-components";
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
  setToCurrency: SwapTransactionType["setToCurrency"];
  toggleMax: SwapTransactionType["toggleMax"];
  reverseSwap: SwapTransactionType["reverseSwap"];
  isMaxEnabled?: boolean;
  fromAmountError?: Error;
  fromAmountWarning?: Error;
  isSwapReversable: boolean;
  provider: string | undefined | null;
  loadingRates: boolean;
  isSendMaxLoading: boolean;
  updateSelectedRate: SwapDataType["updateSelectedRate"];
};

type SwapButtonProps = {
  onClick: SwapTransactionType["reverseSwap"];
  disabled: boolean;
};

const RoundButton = styled(Button)`
  padding: 8px;
  border-radius: 9999px;
  height: initial;
`;

const Main = styled.section`
  display: flex;
  flex-direction: column;
  row-gap: 12px;
  margin-bottom: 5px;
`;

function SwapButton({ onClick, disabled }: SwapButtonProps): JSX.Element {
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
  fromAccount = undefined,
  toAccount,
  fromAmount = undefined,
  isMaxEnabled = false,
  setFromAccount,
  setFromAmount,
  toCurrency,
  toAmount,
  setToCurrency,
  toggleMax,
  fromAmountError,
  fromAmountWarning,
  reverseSwap,
  isSwapReversable,
  provider,
  loadingRates,
  isSendMaxLoading,
  updateSelectedRate,
}: FormInputsProps) {
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const reverseSwapAndTrack = () => {
    track("button_clicked2", {
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
          fromAmountWarning={fromAmountWarning}
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
