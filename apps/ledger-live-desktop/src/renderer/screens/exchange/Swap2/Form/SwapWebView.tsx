import { usePageState } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { context } from "~/renderer/drawers/Provider";
import WebviewErrorDrawer, { SwapLiveError } from "./WebviewErrorDrawer/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { counterValueCurrencySelector, languageSelector } from "~/renderer/reducers/settings";
import useTheme from "~/renderer/hooks/useTheme";
import { Web3AppWebview } from "~/renderer/components/Web3AppWebview";
import { WebviewAPI, WebviewState } from "~/renderer/components/Web3AppWebview/types";
import { initialWebviewState } from "~/renderer/components/Web3AppWebview/helpers";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { handlers as loggerHandlers } from "@ledgerhq/live-common/wallet-api/CustomLogger/server";
import { setStoreValue } from "~/renderer/store";
import { TopBar } from "~/renderer/components/WebPlatformPlayer/TopBar";

type SwapWebProps = {
  inputs: Partial<{
    provider: string;
    fromAccountId: string;
    toAccountId: string;
    fromAmount: string;
    quoteId: string;
    rate: string;
    feeStrategy: string;
    customFeeConfig: string;
  }>;
  pageState: ReturnType<typeof usePageState>;
};

export const SWAP_WEB_MANIFEST_ID = "swap-live-app-demo-0";

const SwapWebAppWrapper = styled.div(
  () => `
  height: 0px;
  width: 0px;
`,
);

const SwapWebView = ({ pageState, inputs }: SwapWebProps) => {
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
  const localManifest = useLocalLiveAppManifest(SWAP_WEB_MANIFEST_ID);
  const remoteManifest = useRemoteLiveAppManifest(SWAP_WEB_MANIFEST_ID);
  const manifest = localManifest || remoteManifest;

  const hasManifest = !!manifest;
  const hasInputs = !!inputs;
  const isPageStateLoaded = pageState === "loaded";

  const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...loggerHandlers,
      "storage.set": ({
        params: { key, value },
      }: {
        params: { key: string; value: SwapLiveError };
      }) => {
        if (key === "error" && value.origin === "swap-web-app") {
          onSwapWebviewError(value);
        }
        setStoreValue(key, {}, SWAP_WEB_MANIFEST_ID);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (webviewState.url.includes("/unknown-error")) {
      // the live app has re-directed to /unknown-error. Handle this in callback, probably wallet-api failure.
      onSwapWebviewError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webviewState.url]);

  if (!hasManifest || !hasInputs || !isPageStateLoaded) {
    return null;
  }
  const onSwapWebviewError = (error?: SwapLiveError) => {
    console.error("onSwapWebviewError", error);
    setDrawer(WebviewErrorDrawer, error);
  };

  const isDevelopment = process.env.NODE_ENV === "development";
  return (
    <>
      {isDevelopment && (
        <TopBar manifest={manifest} webviewAPIRef={webviewAPIRef} webviewState={webviewState} />
      )}
      <SwapWebAppWrapper>
        <Web3AppWebview
          manifest={manifest}
          inputs={{
            ...inputs,
            theme: themeType,
            lang: locale,
            currencyTicker: fiatCurrency.ticker,
          }}
          onStateChange={setWebviewState}
          ref={webviewAPIRef}
          customHandlers={customHandlers}
        />
      </SwapWebAppWrapper>
    </>
  );
};

export default SwapWebView;
