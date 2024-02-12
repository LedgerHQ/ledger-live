import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

import { Box } from "@ledgerhq/react-ui";
import { usePageState } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import ButtonBase from "~/renderer/components/Button";
import SwapFormRates from "../FormRates";
import { SwapWebManifestIDs } from "../SwapWebView";

const Button = styled(ButtonBase)`
  width: 100%;
  justify-content: center;
`;

type SwapMigrationUIProps = {
  liveAppEnabled: boolean;
  liveApp: React.ReactNode;
  manifestID: string | null;
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

export const SwapMigrationUI = (props: SwapMigrationUIProps) => {
  const {
    liveAppEnabled,
    liveApp,
    manifestID,
    pageState,
    swapTransaction,
    provider,
    refreshTime,
    countdown,
    disabled,
    onClick,
  } = props;
  const { t } = useTranslation();

  const nativeQuotesUI =
    pageState === "loaded" ? (
      <SwapFormRates
        swap={swapTransaction.swap}
        provider={provider}
        refreshTime={refreshTime}
        countdown={countdown}
      />
    ) : null;

  const nativeExchangeButtonUI = (
    <Box width="100%">
      <Button primary disabled={disabled} onClick={onClick} data-test-id="exchange-button">
        {t("common.exchange")}
      </Button>
    </Box>
  );

  /**
   * Fall back to show all native UI. (without webview)
   */
  const allNativeUI = (
    <>
      {nativeQuotesUI}
      {nativeExchangeButtonUI}
    </>
  );

  /**
   * Live app disabled or unavailable, fallback to native UI
   */
  if (!liveAppEnabled || !liveApp) {
    return allNativeUI;
  }

  switch (true) {
    case manifestID?.startsWith(SwapWebManifestIDs.Demo0):
      /**
       * Demo 0 live app should only contain Exchange Button
       * Rest should be in native UI (e.g quotes)
       */
      return (
        <>
          {nativeQuotesUI}
          {liveApp}
        </>
      );

    case manifestID?.startsWith(SwapWebManifestIDs.Demo1):
      /**
       * Demo 1 live app should contain:
       *  - Exchange Button
       *  - Quotes UI
       */
      return <>{liveApp}</>;

    /**
     * Fall back to show all native UI
     */
    default:
      return allNativeUI;
  }
};
