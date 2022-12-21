import { shell, WebviewTag } from "electron";
import * as remote from "@electron/remote";
import { JSONRPCRequest } from "json-rpc-2.0";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import {
  receiveOnAccountLogic,
  signTransactionLogic,
  completeExchangeLogic,
  CompleteExchangeRequest,
  CompleteExchangeUiRequest,
  signMessageLogic,
} from "@ledgerhq/live-common/platform/logic";
import { serializePlatformSignedTransaction } from "@ledgerhq/live-common/platform/serializers";
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
import trackingWrapper from "@ledgerhq/live-common/platform/tracking";

import { openModal } from "../../actions/modals";
import TrackPage from "../../analytics/TrackPage";
import useTheme from "../../hooks/useTheme";
import { flattenAccountsSelector } from "../../reducers/accounts";
import BigSpinner from "../BigSpinner";

import { track } from "~/renderer/analytics/segment";
import TopBar from "./TopBar";
import { TopBarConfig } from "./type";
import {
  requestAccountLogic,
  broadcastTransactionLogic,
  RequestAccountParams,
} from "./LiveAppSDKLogic";
import { Container, Wrapper, CustomWebview, Loader } from "./styled";

const tracking = trackingWrapper(track);

type WebPlatformPlayerConfig = {
  topBarConfig?: TopBarConfig;
};

type Props = {
  manifest: AppManifest;
  onClose?: () => void;
  inputs?: Record<string, any>;
  config?: WebPlatformPlayerConfig;
};

export function WebView({ manifest, onClose, inputs = {}, config }: Props) {
  const theme = useTheme("colors.palette");

  const targetRef: { current: null | WebviewTag } = useRef(null);
  const dispatch = useDispatch();
  const accounts = useSelector(flattenAccountsSelector);
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
    ({ accountId }: { accountId: string }) =>
      receiveOnAccountLogic(
        { manifest, accounts, tracking },
        accountId,
        (account, parentAccount, accountAddress) => {
          // FIXME: handle address rejection (if user reject address, we don't end up in onResult nor in onCancel 🤔)
          return new Promise((resolve, reject) =>
            dispatch(
              openModal("MODAL_EXCHANGE_CRYPTO_DEVICE", {
                account,
                parentAccount,
                onResult: (_account: Account, _parentAccount: Account) => {
                  tracking.platformReceiveSuccess(manifest);
                  resolve(accountAddress);
                },
                onCancel: (error: Error) => {
                  tracking.platformReceiveFail(manifest);
                  reject(error);
                },
                verifyAddress: true,
              }),
            ),
          );
        },
      ),
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
      return signTransactionLogic(
        { manifest, accounts, tracking },
        accountId,
        transaction,
        (account, parentAccount, { canEditFees, hasFeesProvided, liveTx }) => {
          return new Promise((resolve, reject) =>
            dispatch(
              openModal("MODAL_SIGN_TRANSACTION", {
                canEditFees,
                stepId: canEditFees && !hasFeesProvided ? "amount" : "summary",
                transactionData: liveTx,
                useApp: params?.useApp,
                account,
                parentAccount,
                onResult: (signedOperation: SignedOperation) => {
                  tracking.platformSignTransactionSuccess(manifest);
                  resolve(serializePlatformSignedTransaction(signedOperation));
                },
                onCancel: (error: Error) => {
                  tracking.platformSignTransactionFail(manifest);
                  reject(error);
                },
              }),
            ),
          );
        },
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
      tracking.platformStartExchangeRequested(manifest);

      return new Promise((resolve, reject) =>
        dispatch(
          openModal("MODAL_PLATFORM_EXCHANGE_START", {
            exchangeType,
            onResult: (nonce: string) => {
              tracking.platformStartExchangeSuccess(manifest);
              resolve(nonce);
            },
            onCancel: (error: Error) => {
              tracking.platformStartExchangeFail(manifest);
              reject(error);
            },
          }),
        ),
      );
    },
    [manifest, dispatch],
  );

  const completeExchange = useCallback(
    (completeRequest: CompleteExchangeRequest) => {
      return completeExchangeLogic(
        { manifest, accounts, tracking },
        completeRequest,
        ({
          provider,
          exchange,
          transaction,
          binaryPayload,
          signature,
          feesStrategy,
          exchangeType,
        }: CompleteExchangeUiRequest): Promise<Operation> =>
          new Promise((resolve, reject) => {
            dispatch(
              openModal("MODAL_PLATFORM_EXCHANGE_COMPLETE", {
                provider,
                exchange,
                transaction,
                binaryPayload,
                signature,
                feesStrategy,
                exchangeType,
                onResult: (operation: Operation) => {
                  tracking.platformCompleteExchangeSuccess(manifest);
                  resolve(operation);
                },
                onCancel: (error: Error) => {
                  tracking.platformCompleteExchangeFail(manifest);
                  reject(error);
                },
              }),
            );
          }),
      );
    },
    [accounts, dispatch, manifest],
  );

  const signMessage = useCallback(
    ({ accountId, message }: { accountId: string; message: string }) => {
      return signMessageLogic(
        { manifest, accounts, tracking },
        accountId,
        message,
        (account, message) =>
          new Promise((resolve, reject) => {
            dispatch(
              openModal("MODAL_SIGN_MESSAGE", {
                message,
                account,
                onConfirmationHandler: (signature: string) => {
                  tracking.platformSignMessageSuccess(manifest);
                  resolve(signature);
                },
                onFailHandler: (err: Error) => {
                  tracking.platformSignMessageFail(manifest);
                  reject(err);
                },
                onClose: () => {
                  tracking.platformSignMessageUserRefused(manifest);
                  reject(UserRefusedOnDevice());
                },
              }),
            );
          }),
      );
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
            <BigSpinner data-test-id="live-app-loading-spinner" size={50} />
          </Loader>
        ) : null}
      </Wrapper>
    </Container>
  );
}
