import { shell, WebviewTag } from "electron";
import * as remote from "@electron/remote";
import { JSONRPCRequest } from "json-rpc-2.0";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { AppManifest } from "@ledgerhq/live-common/platform/types";
import { useJSONRPCServer } from "@ledgerhq/live-common/platform/JSONRPCServer";
import {
  RawPlatformSignedTransaction,
  RawPlatformTransaction,
} from "@ledgerhq/live-common/platform/rawTypes";
import {
  useListPlatformAccounts,
  useListPlatformCurrencies,
  usePlatformUrl,
} from "@ledgerhq/live-common/platform/react";

import TrackPage from "../../analytics/TrackPage";
import useTheme from "../../hooks/useTheme";
import { accountsSelector } from "../../reducers/accounts";
import BigSpinner from "../BigSpinner";
import Box from "../Box";

import TopBar from "./TopBar";
import { track } from "~/renderer/analytics/segment";
import trackingWrapper from "@ledgerhq/live-common/platform/tracking";
import { TopBarConfig } from "./type";
import {
  receiveOnAccountLogic,
  requestAccountLogic,
  signTransactionLogic,
  broadcastTransactionLogic,
  startExchangeLogic,
  CompleteExchangeRequest,
  completeExchangeLogic,
  RequestAccountParams,
  signMessageLogic,
} from "./LiveAppSDKLogic";

const tracking = trackingWrapper(track);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
`;

// $FlowFixMe
const CustomWebview = styled("webview")`
  border: none;
  width: 100%;
  flex: 1;
  transition: opacity 200ms ease-out;
`;

const Wrapper = styled(Box).attrs(() => ({
  flex: 1,
}))`
  position: relative;
`;

const Loader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

type WebPlatformPlayerConfig = {
  topBarConfig?: TopBarConfig;
};

type Props = {
  manifest: AppManifest;
  onClose?: () => void;
  inputs?: Record<string, any>;
  config?: WebPlatformPlayerConfig;
};

export default function WebPlatformPlayer({ manifest, onClose, inputs = {}, config }: Props) {
  const theme = useTheme("colors.palette");

  const targetRef: { current: null | WebviewTag } = useRef(null);
  const dispatch = useDispatch();
  const accounts = flattenAccounts(useSelector(accountsSelector));
  const { pushToast } = useToasts();
  const { t } = useTranslation();

  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const url = usePlatformUrl(
    manifest,
    {
      background: theme.background.paper,
      text: theme.text.shade100,
    },
    inputs,
  );

  const listAccounts = useListPlatformAccounts(accounts);
  const listCurrencies = useListPlatformCurrencies();

  const requestAccount = useCallback(
    (request: RequestAccountParams) => {
      return requestAccountLogic({ manifest }, request);
    },
    [manifest],
  );

  const receiveOnAccount = useCallback(
    ({ accountId }: { accountId: string }) => {
      return receiveOnAccountLogic({ manifest, dispatch, accounts }, accountId);
    },
    [manifest, accounts, dispatch],
  );

  const signTransaction = useCallback(
    ({
      accountId,
      transaction,
      params,
    }: {
      accountId: string;
      transaction: RawPlatformTransaction;
      params?: {
        /**
         * The name of the Ledger Nano app to use for the signing process
         */
        useApp: string;
      };
    }) => {
      return signTransactionLogic({ manifest, dispatch, accounts }, accountId, transaction, params);
    },
    [manifest, dispatch, accounts],
  );

  const broadcastTransaction = useCallback(
    async ({
      accountId,
      signedTransaction,
    }: {
      accountId: string;
      signedTransaction: RawPlatformSignedTransaction;
    }) => {
      return broadcastTransactionLogic(
        { manifest, dispatch, accounts },
        accountId,
        signedTransaction,
        pushToast,
        t,
      );
    },
    [manifest, accounts, pushToast, dispatch, t],
  );

  const startExchange = useCallback(
    ({ exchangeType }: { exchangeType: number }) => {
      return startExchangeLogic({ manifest, dispatch }, exchangeType);
    },
    [manifest, dispatch],
  );

  const completeExchange = useCallback(
    (completeRequest: CompleteExchangeRequest) => {
      return completeExchangeLogic({ manifest, dispatch, accounts }, completeRequest);
    },
    [accounts, dispatch, manifest],
  );

  const signMessage = useCallback(
    ({ accountId, message }: { accountId: string; message: string }) => {
      return signMessageLogic({ manifest, dispatch, accounts }, accountId, message);
    },
    [accounts, dispatch, manifest],
  );

  const handlers = useMemo(
    () => ({
      "account.list": listAccounts,
      "currency.list": listCurrencies,
      "account.request": requestAccount,
      "account.receive": receiveOnAccount,
      "transaction.sign": signTransaction,
      "transaction.broadcast": broadcastTransaction,
      "exchange.start": startExchange,
      "exchange.complete": completeExchange,
      "message.sign": signMessage,
    }),
    [
      listAccounts,
      listCurrencies,
      requestAccount,
      receiveOnAccount,
      signTransaction,
      broadcastTransaction,
      startExchange,
      completeExchange,
      signMessage,
    ],
  );

  const handleSend = useCallback((request: JSONRPCRequest): Promise<void> => {
    const webview = targetRef.current;
    if (webview) {
      const origin = new URL(webview.src).origin;
      webview.contentWindow.postMessage(JSON.stringify(request), origin);
    }

    return Promise.resolve();
  }, []);

  const [receive] = useJSONRPCServer(handlers, handleSend);

  const handleMessage = useCallback(
    event => {
      if (event.channel === "webviewToParent") {
        receive(JSON.parse(event.args[0]));
      }
    },
    [receive],
  );

  useEffect(() => {
    tracking.platformLoad(manifest);
    const webview = targetRef.current;
    if (webview) {
      webview.addEventListener("ipc-message", handleMessage);
    }

    return () => {
      if (webview) {
        webview.removeEventListener("ipc-message", handleMessage);
      }
    };
  }, [manifest, handleMessage]);

  const handleLoad = useCallback(() => {
    tracking.platformLoadSuccess(manifest);
    setWidgetLoaded(true);
  }, [manifest]);

  const handleReload = useCallback(() => {
    const webview = targetRef.current;
    if (webview) {
      tracking.platformReload(manifest);
      setWidgetLoaded(false);
      webview.reloadIgnoringCache();
    }
  }, [manifest]);

  const handleNewWindow = useCallback(async e => {
    const protocol = new URL(e.url).protocol;
    if (protocol === "http:" || protocol === "https:") {
      await shell.openExternal(e.url);
    }
  }, []);

  useEffect(() => {
    const webview = targetRef.current;

    if (webview) {
      // For mysterious reasons, the webpreferences attribute does not
      // pass through the styled component when added in the JSX.
      webview.webpreferences = "nativeWindowOpen=no";
      webview.addEventListener("new-window", handleNewWindow);
      webview.addEventListener("did-finish-load", handleLoad);
    }

    return () => {
      if (webview) {
        webview.removeEventListener("new-window", handleNewWindow);
        webview.removeEventListener("did-finish-load", handleLoad);
      }
    };
  }, [handleLoad, handleNewWindow]);

  return (
    <Container>
      <TrackPage category="Platform" name="App" appId={manifest.id} params={inputs} />
      <TopBar
        manifest={manifest}
        onReload={handleReload}
        onClose={onClose}
        webviewRef={targetRef}
        config={config?.topBarConfig}
      />

      <Wrapper>
        <CustomWebview
          src={url.toString()}
          ref={targetRef}
          style={{ opacity: widgetLoaded ? 1 : 0 }}
          preload={`file://${remote.app.dirname}/webviewPreloader.bundle.js`}
        />
        {!widgetLoaded ? (
          <Loader>
            <BigSpinner size={50} />
          </Loader>
        ) : null}
      </Wrapper>
    </Container>
  );
}
