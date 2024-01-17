import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import { Box } from "@ledgerhq/react-ui";
import { usePageState } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import ButtonBase from "~/renderer/components/Button";
import SwapFormRates from "../FormRates";

const Button = styled(ButtonBase)`
  justify-content: center;
`;

export type SwapDemo1NativeUIProps = {
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

export const SwapDemo1NativeUI = (props: SwapDemo1NativeUIProps) => {
  const { pageState, swapTransaction, provider, refreshTime, countdown, disabled, onClick } = props;
  const { t } = useTranslation();
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
      <Box>
        <Button primary disabled={disabled} onClick={onClick} data-test-id="exchange-button">
          {t("common.exchange")}
        </Button>
      </Box>
    </>
  );
};
