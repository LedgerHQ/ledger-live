import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { context } from "~/renderer/drawers/Provider";
import WebviewErrorDrawer, { SwapLiveError } from "./WebviewErrorDrawer/index";

import { counterValueCurrencySelector, languageSelector } from "~/renderer/reducers/settings";
import useTheme from "~/renderer/hooks/useTheme";
import { Web3AppWebview } from "~/renderer/components/Web3AppWebview";
import { WebviewAPI, WebviewProps, WebviewState } from "~/renderer/components/Web3AppWebview/types";
import { initialWebviewState } from "~/renderer/components/Web3AppWebview/helpers";
import { handlers as loggerHandlers } from "@ledgerhq/live-common/wallet-api/CustomLogger/server";
import { TopBar } from "~/renderer/components/WebPlatformPlayer/TopBar";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { SwapOperation } from "@ledgerhq/types-live/lib/swap";
import BigNumber from "bignumber.js";
import { SubAccount } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { useRedirectToSwapHistory } from "../utils/index";

import { captureException } from "~/sentry/internal";
import { usePTXCustomHandlers } from "~/renderer/components/WebPTXPlayer/CustomHandlers";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

const isDevelopment = process.env.NODE_ENV === "development";

export class UnableToLoadSwapLiveError extends Error {
  constructor(message: string) {
    const name = "UnableToLoadSwapLiveError";
    super(message || name);
    this.name = name;
    this.message = message;
  }
}

type CustomHandlersParams<Params> = {
  params: Params;
};

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
};

export type SwapWebProps = {
  manifest: LiveAppManifest;
  swapState?: Partial<SwapProps>;
  liveAppUnavailable(): void;
};

export const SwapWebManifestIDs = {
  Demo0: "swap-live-app-demo-0",
  Demo1: "swap-live-app-demo-1",
};

export const useSwapLiveAppManifestID = () => {
  const demo0 = useFeature("ptxSwapLiveAppDemoZero");
  const demo1 = useFeature("ptxSwapLiveAppDemoOne");
  switch (true) {
    case demo1?.enabled:
      return demo1?.params?.manifest_id ?? SwapWebManifestIDs.Demo1;
    case demo0?.enabled:
      return demo0?.params?.manifest_id ?? SwapWebManifestIDs.Demo0;
    default:
      return null;
  }
};

const SwapWebAppWrapper = styled.div`
  width: 100%;
  flex: 1;
`;

const SwapWebView = ({ manifest, swapState, liveAppUnavailable }: SwapWebProps) => {
  const {
    colors: {
      palette: { type: themeType },
    },
  } = useTheme();
  const dispatch = useDispatch();
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const { setDrawer } = React.useContext(context);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(languageSelector);
  const redirectToHistory = useRedirectToSwapHistory();

  const hasSwapState = !!swapState;
  const customPTXHandlers = usePTXCustomHandlers(manifest);
  const customHandlers = useMemo(() => {
    return {
      ...loggerHandlers,
      ...customPTXHandlers,
      "custom.swapStateGet": () => {
        return Promise.resolve(swapState);
      },
      // TODO: when we need bidirectional communication
      // "custom.swapStateSet": (params: CustomHandlersParams<unknown>) => {
      //   return Promise.resolve();
      // },
      "custom.throwExchangeErrorToLedgerLive": ({
        params,
      }: CustomHandlersParams<SwapLiveError>) => {
        onSwapWebviewError(params);
        return Promise.resolve();
      },
      "custom.saveSwapToHistory": ({
        params,
      }: {
        params: { swap: SwapProps; transaction_id: string };
      }) => {
        const { swap, transaction_id } = params;
        if (!swap || !transaction_id || !swap.provider || !swap.fromAmount || !swap.toAmount) {
          return Promise.reject("Cannot save swap missing params");
        }
        const fromId = getAccountIdFromWalletAccountId(swap.fromAccountId);
        const toId = getAccountIdFromWalletAccountId(swap.toAccountId);
        if (!fromId || !toId) return Promise.reject("Accounts not found");
        const operationId = `${fromId}-${transaction_id}-OUT`;

        const swapOperation: SwapOperation = {
          status: "pending",
          provider: swap.provider,
          operationId,
          swapId: transaction_id,
          receiverAccountId: toId,
          tokenId: toId,
          fromAmount: new BigNumber(swap.fromAmount),
          toAmount: new BigNumber(swap.toAmount),
        };

        dispatch(
          updateAccountWithUpdater(fromId, account => {
            const fromCurrency = getAccountCurrency(account);
            const isFromToken = fromCurrency.type === "TokenCurrency";
            const subAccounts = account.type === "Account" && account.subAccounts;
            return isFromToken && subAccounts
              ? {
                  ...account,
                  subAccounts: subAccounts.map<SubAccount>((a: SubAccount) => {
                    const subAccount = {
                      ...a,
                      swapHistory: [...a.swapHistory, swapOperation],
                    };
                    return a.id === fromId ? subAccount : a;
                  }),
                }
              : { ...account, swapHistory: [...account.swapHistory, swapOperation] };
          }),
        );
        return Promise.resolve();
      },
      "custom.throwGenericErrorToLedgerLive": () => {
        onSwapWebviewError();
        return Promise.resolve();
      },
      "custom.swapRedirectToHistory": () => {
        redirectToHistory();
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapState?.cacheKey]);

  useEffect(() => {
    if (webviewState.url.includes("/unknown-error")) {
      // the live app has re-directed to /unknown-error. Handle this in callback, probably wallet-api failure.
      onSwapWebviewError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webviewState.url]);

  // return loader???
  if (!hasSwapState) {
    return null;
  }

  const onSwapWebviewError = (error?: SwapLiveError) => {
    console.error("onSwapWebviewError", error);
    setDrawer(WebviewErrorDrawer, error);
  };

  const onStateChange: WebviewProps["onStateChange"] = state => {
    setWebviewState(state);
    if (!state.loading && state.isAppUnavailable) {
      console.error("onSwapLiveAppUnavailable", state);
      liveAppUnavailable();
      captureException(
        new UnableToLoadSwapLiveError(
          '"Failed to load swap live app using WebPlatformPlayer in SwapWeb",',
        ),
      );
    }
  };

  return (
    <>
      {isDevelopment && (
        <TopBar
          manifest={{ ...manifest, url: `${manifest.url}#${swapState.cacheKey}` }}
          webviewAPIRef={webviewAPIRef}
          webviewState={webviewState}
        />
      )}
      <SwapWebAppWrapper>
        <Web3AppWebview
          manifest={{ ...manifest, url: `${manifest.url}#${swapState.cacheKey}` }}
          inputs={{
            theme: themeType,
            lang: locale,
            currencyTicker: fiatCurrency.ticker,
          }}
          onStateChange={onStateChange}
          ref={webviewAPIRef}
          customHandlers={customHandlers as never}
        />
      </SwapWebAppWrapper>
    </>
  );
};

export default SwapWebView;
