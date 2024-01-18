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
    console.log('[swap] live app disabled or live app missing', {
      liveAppEnabled,
      liveApp: Boolean(liveApp)
    })
    return allNativeUI;
  }

  switch (manifestID) {
    /**
     * Demo 0 live app should only contain Exchange Button
     * Rest should be in native UI (e.g quotes)
     */
    case SwapWebManifestIDs.Demo0:
      console.log('[swap] demo 0 live app')
      return (
        <>
          {nativeQuotesUI}
          {liveApp}
        </>
      );
    case SwapWebManifestIDs.Demo1:
      console.log('[swap] demo 1 live app')
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
      console.log('[swap] live app enabled but native fall back')
      return allNativeUI;
  }
};
