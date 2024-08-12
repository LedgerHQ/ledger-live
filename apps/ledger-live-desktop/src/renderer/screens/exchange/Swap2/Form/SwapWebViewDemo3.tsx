import { SwapLiveError } from "@ledgerhq/live-common/exchange/swap/types";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { handlers as loggerHandlers } from "@ledgerhq/live-common/wallet-api/CustomLogger/server";
import { getEnv } from "@ledgerhq/live-env";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Web3AppWebview } from "~/renderer/components/Web3AppWebview";
import { initialWebviewState } from "~/renderer/components/Web3AppWebview/helpers";
import { WebviewAPI, WebviewProps, WebviewState } from "~/renderer/components/Web3AppWebview/types";
import { TopBar } from "~/renderer/components/WebPlatformPlayer/TopBar";
import { usePTXCustomHandlers } from "~/renderer/components/WebPTXPlayer/CustomHandlers";
import { context } from "~/renderer/drawers/Provider";
import useTheme from "~/renderer/hooks/useTheme";
import logger from "~/renderer/logger";
import {
  counterValueCurrencySelector,
  enablePlatformDevToolsSelector,
  languageSelector,
} from "~/renderer/reducers/settings";
import { captureException } from "~/sentry/renderer";
import WebviewErrorDrawer from "./WebviewErrorDrawer/index";

export class UnableToLoadSwapLiveError extends Error {
  constructor(message: string) {
    const name = "UnableToLoadSwapLiveError";
    super(message || name);
    this.name = name;
    this.message = message;
  }
}

export type SwapProps = {
  provider: string;
  fromAccountId: string;
  fromParentAccountId?: string;
  toAccountId: string;
  fromAmount: string;
  toAmount?: string;
  quoteId: string;
  rate: string;
  feeStrategy: string;
  customFeeConfig: string;
  cacheKey: string;
  loading: boolean;
  error: boolean;
  providerRedirectURL: string;
  toNewTokenId: string;
  swapApiBase: string;
  estimatedFees: string;
  estimatedFeesUnit: string;
};

export type SwapWebProps = {
  manifest: LiveAppManifest;
  liveAppUnavailable: () => void;
};

const SwapWebAppWrapper = styled.div`
  width: 100%;
  flex: 1;
`;

const SWAP_API_BASE = getEnv("SWAP_API_BASE");

const SwapWebView = ({ manifest, liveAppUnavailable }: SwapWebProps) => {
  const {
    colors: {
      palette: { type: themeType },
    },
  } = useTheme();

  const webviewAPIRef = useRef<WebviewAPI>(null);
  const { setDrawer } = React.useContext(context);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(languageSelector);
  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);

  const customPTXHandlers = usePTXCustomHandlers(manifest);
  const customHandlers = useMemo(
    () => ({
      ...loggerHandlers,
      ...customPTXHandlers,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const hashString = useMemo(() => new URLSearchParams({}).toString(), []);

  const onSwapWebviewError = (error?: SwapLiveError) => {
    console.error("onSwapWebviewError", error);
    logger.critical(error);
    setDrawer(WebviewErrorDrawer, error);
  };

  const onStateChange: WebviewProps["onStateChange"] = state => {
    setWebviewState(state);

    if (!state.loading && state.isAppUnavailable) {
      liveAppUnavailable();
      captureException(
        new UnableToLoadSwapLiveError(
          '"Failed to load swap live app using WebPlatformPlayer in SwapWeb",',
        ),
      );
    }
  };

  useEffect(() => {
    if (webviewState.url.includes("/unknown-error")) {
      // the live app has re-directed to /unknown-error. Handle this in callback, probably wallet-api failure.
      onSwapWebviewError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webviewState.url]);

  return (
    <>
      {enablePlatformDevTools && (
        <TopBar
          manifest={{ ...manifest, url: `${manifest.url}#${hashString}` }}
          webviewAPIRef={webviewAPIRef}
          webviewState={webviewState}
        />
      )}

      <SwapWebAppWrapper>
        <Web3AppWebview
          manifest={{ ...manifest, url: `${manifest.url}#${hashString}` }}
          inputs={{
            theme: themeType,
            lang: locale,
            currencyTicker: fiatCurrency.ticker,
            swapApiBase: SWAP_API_BASE,
          }}
          onStateChange={onStateChange}
          ref={webviewAPIRef}
          customHandlers={customHandlers as never}
          hideLoader
        />
      </SwapWebAppWrapper>
    </>
  );
};

export default SwapWebView;
