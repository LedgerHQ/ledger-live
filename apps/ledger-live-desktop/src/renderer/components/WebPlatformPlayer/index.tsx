import { shell, WebviewTag } from "electron";
import * as remote from "@electron/remote";
import { JSONRPCRequest } from "json-rpc-2.0";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import { listSupportedCurrencies } from "@ledgerhq/live-common/lib/currencies";
import { useToasts } from "@ledgerhq/live-common/lib/notifications/ToastProvider";
import { AppManifest } from "@ledgerhq/live-common/lib/platform/types";
import { useJSONRPCServer } from "@ledgerhq/live-common/lib/platform/JSONRPCServer";
import {
  RawPlatformSignedTransaction,
  RawPlatformTransaction,
} from "@ledgerhq/live-common/lib/platform/rawTypes";

import TrackPage from "../../analytics/TrackPage";
import useTheme from "../../hooks/useTheme";
import { accountsSelector } from "../../reducers/accounts";
import BigSpinner from "../BigSpinner";
import Box from "../Box";

import TopBar from "./TopBar";
import * as tracking from "./tracking";
import { TopBarConfig } from "./type";
import {
  listAccountsCallback,
  listCurrenciesCallback,
  receiveOnAccountCallback,
  requestAccountCallback,
  signTransactionCallback,
  broadcastTransactionCallback,
  startExchangeCallback,
  CompleteExchangeRequest,
  completeExchangeCallback,
  RequestAccountParams,
} from "./LiveAppSDKCallback";

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
  topBarConfig?: TopBarConfig,
};

type Props = {
  manifest: AppManifest;
  onClose?: () => void;
  inputs?: Record<string, any>;
  config?: WebPlatformPlayerConfig;
};

const WebPlatformPlayer = ({ manifest, onClose, inputs, config }: Props) => {
  const theme = useTheme("colors.palette");

  const targetRef: { current: null | WebviewTag } = useRef(null);
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const currencies = useMemo(() => listSupportedCurrencies(), []);
  const { pushToast } = useToasts();
  const { t } = useTranslation();

  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const url = useMemo(() => {
    const urlObj = new URL(manifest.url.toString());

    if (inputs) {
      for (const key in inputs) {
        if (Object.prototype.hasOwnProperty.call(inputs, key)) {
          urlObj.searchParams.set(key, inputs[key]);
        }
      }
    }

    urlObj.searchParams.set("backgroundColor", theme.background.paper);
    urlObj.searchParams.set("textColor", theme.text.shade100);
    if (manifest.params) {
      urlObj.searchParams.set("params", JSON.stringify(manifest.params));
    }

    return urlObj;
  }, [manifest.url, theme, inputs, manifest.params]);

  const listAccounts = useCallback(() => {
    return listAccountsCallback(accounts);
  }, [accounts]);

  const listCurrencies = useCallback(() => {
    return listCurrenciesCallback(currencies);
  }, [currencies]);

  const requestAccount = useCallback(
    (request: RequestAccountParams) => {
      return requestAccountCallback({ manifest, dispatch }, request);
    },
    [manifest, dispatch],
  );

  const receiveOnAccount = useCallback(
    ({ accountId }: { accountId: string }) => {
      return receiveOnAccountCallback(accountId, { manifest, dispatch, accounts });
    },
    [manifest, accounts, dispatch],
  );

  const signTransaction = useCallback(
    ({
      accountId,
      transaction,
      params = {},
    }: {
      accountId: string;
      transaction: RawPlatformTransaction;
      params: any;
    }) => {
      return signTransactionCallback(
        { manifest, dispatch, accounts },
        accountId,
        transaction,
        params,
      );
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
      return broadcastTransactionCallback(
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
      return startExchangeCallback({ manifest, dispatch }, exchangeType);
    },
    [manifest, dispatch],
  );

  const completeExchange = useCallback(
    (completeRequest: CompleteExchangeRequest) => {
      return completeExchangeCallback({ manifest, dispatch, accounts }, completeRequest);
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
    ],
  );

  const handleSend = useCallback(
    (request: JSONRPCRequest): Promise<void> => {
      const webview = targetRef.current;
      if (webview) {
        webview.contentWindow.postMessage(JSON.stringify(request), url.origin);
      }

      return Promise.resolve();
    },
    [url],
  );

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

  const handleOpenDevTools = useCallback(() => {
    const webview = targetRef.current;

    if (webview) {
      webview.openDevTools();
    }
  }, []);

  return (
    <Container>
      <TrackPage category="Platform" name="App" appId={manifest.id} params={inputs} />
      <TopBar
        manifest={manifest}
        onReload={handleReload}
        onClose={onClose}
        onOpenDevTools={handleOpenDevTools}
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
};

export default WebPlatformPlayer;
