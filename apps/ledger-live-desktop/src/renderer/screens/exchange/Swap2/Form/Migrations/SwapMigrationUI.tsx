import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import { usePageState } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import { Box } from "@ledgerhq/react-ui";
import ButtonBase from "~/renderer/components/Button";
import SwapFormRates from "../FormRates";
import SwapFormSummary from "../FormSummary";
import LoadingState from "../Rates/LoadingState";
import { SwapWebManifestIDs } from "../SwapWebView";
import { useIsSwapLiveFlagEnabled } from "../useIsSwapLiveFlagEnabled";

const Button = styled(ButtonBase)`
  width: 100%;
  justify-content: center;
`;

type SwapMigrationUIProps = {
  liveAppEnabled: boolean;
  liveApp: React.ReactNode;
  manifestID: string | undefined;
  // Demo 1 props
  pageState: ReturnType<typeof usePageState>;
  swapTransaction: SwapTransactionType;
  provider?: string;
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
    disabled,
    onClick,
  } = props;
  const { t } = useTranslation();
  const isDemo1Enabled = useIsSwapLiveFlagEnabled("ptxSwapLiveAppDemoOne");

  const nativeLoadingUI = pageState === "loading" ? <LoadingState /> : null;
  const nativeNetworkFeesUI =
    pageState === "loaded" || isDemo1Enabled ? (
      <SwapFormSummary swapTransaction={swapTransaction} provider={provider} />
    ) : null;

  const nativeQuotesUI =
    pageState === "loaded" && !isDemo1Enabled ? (
      <SwapFormRates
        swap={swapTransaction.swap}
        provider={provider}
        countdownSecondsToRefresh={swapTransaction.swap.countdown}
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
      {nativeLoadingUI}
      {nativeNetworkFeesUI}
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
          {nativeLoadingUI}
          {nativeNetworkFeesUI}
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
      return (
        <>
          {nativeNetworkFeesUI}
          {liveApp}
        </>
      );

    /**
     * Fall back to show all native UI
     */
    default:
      return allNativeUI;
  }
};
