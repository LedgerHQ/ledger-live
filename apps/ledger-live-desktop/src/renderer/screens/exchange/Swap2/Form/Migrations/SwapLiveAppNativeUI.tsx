import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Box } from "@ledgerhq/react-ui";
import { usePageState } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import ButtonBase from "~/renderer/components/Button";
import SwapFormRates from "../FormRates";

const Button = styled(ButtonBase)`
  align-self: center;
  justify-content: center;
`;

export type SwapLiveAppNativeUIProps = {
  manifestID?: string;
  // Demo 1 props
  pageState: ReturnType<typeof usePageState>;
  swapTransaction: SwapTransactionType;
  provider?: string;
  refreshTime: number;
  countdown: boolean;
  // Demo 0 props
  disabled: boolean;
  onClick: () => void;
};

export const SwapLiveAppNativeUI = (props: SwapLiveAppNativeUIProps) => {
  const { pageState, swapTransaction, provider, refreshTime, countdown, disabled, onClick } = props;
  const { t } = useTranslation();

  /**
   * Show quotes for Demo 0 
   */
  // const showQuote
  return (
    <>
      {pageState === "loaded" && (
        <SwapFormRates
          swap={swapTransaction.swap}
          provider={provider}
          refreshTime={refreshTime}
          countdown={countdown}
        />
      )}
      <Box flex={1} backgroundColor={"red"}>
        <Button primary disabled={disabled} onClick={onClick} data-test-id="exchange-button">
          {t("common.exchange")}
        </Button>
      </Box>
    </>
  );
};
