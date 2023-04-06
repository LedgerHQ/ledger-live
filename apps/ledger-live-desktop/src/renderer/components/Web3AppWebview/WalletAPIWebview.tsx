/* eslint-disable react/prop-types */

import * as remote from "@electron/remote";
import React, { forwardRef, RefObject, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import { Account, Operation } from "@ledgerhq/types-live";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";

import {
  useWalletAPIServer,
  useConfig,
  UiHook,
  ExchangeType,
} from "@ledgerhq/live-common/wallet-api/react";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/tracking";
import { getEnv } from "@ledgerhq/live-common/env";

import { openModal } from "../../actions/modals";
import { updateAccountWithUpdater } from "../../actions/accounts";
import { flattenAccountsSelector } from "../../reducers/accounts";
import BigSpinner from "../BigSpinner";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import SelectAccountAndCurrencyDrawer from "~/renderer/drawers/DataSelector/SelectAccountAndCurrencyDrawer";
import { track } from "~/renderer/analytics/segment";
import { shareAnalyticsSelector } from "~/renderer/reducers/settings";
import { Loader } from "./styled";
import { WebviewAPI, WebviewProps, WebviewTag } from "./types";
import { useWebviewState } from "./helpers";
import { getStoreValue, setStoreValue } from "~/renderer/store";

const wallet = { name: "ledger-live-desktop", version: __APP_VERSION__ };
const tracking = trackingWrapper(track);

function useUiHook(manifest: AppManifest): Partial<UiHook> {
  const { pushToast } = useToasts();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  return useMemo(
    () => ({
      "account.request": ({ accounts$, currencies, onSuccess, onError }) => {
        setDrawer(
          SelectAccountAndCurrencyDrawer,
          {
            currencies,
            onAccountSelected: (account: Account, parentAccount: Account | undefined) => {
              setDrawer();
              onSuccess(account, parentAccount);
            },
            accounts$,
          },
          {
            onRequestClose: () => {
              setDrawer();
              onError();
            },
          },
        );
      },
      "account.receive": ({ account, parentAccount, accountAddress, onSuccess, onError }) => {
        dispatch(
          openModal("MODAL_EXCHANGE_CRYPTO_DEVICE", {
            account,
            parentAccount,
            onResult: () => {
              onSuccess(accountAddress);
            },
            onCancel: onError,
            verifyAddress: true,
          }),
        );
      },
      "message.sign": ({ account, message, onSuccess, onError, onCancel }) => {
        dispatch(
          openModal("MODAL_SIGN_MESSAGE", {
            account,
            message,
            onConfirmationHandler: onSuccess,
            onFailHandler: onError,
            onClose: onCancel,
          }),
        );
      },
      "storage.get": ({ key, storeId }) => {
        return getStoreValue(key, storeId);
      },
      "storage.set": ({ key, value, storeId }) => {
        setStoreValue(key, value, storeId);
      },
      "transaction.sign": ({
        account,
        parentAccount,
        signFlowInfos: { canEditFees, hasFeesProvided, liveTx },
        options,
        onSuccess,
        onError,
      }) => {
        dispatch(
          openModal("MODAL_SIGN_TRANSACTION", {
            canEditFees,
            stepId: canEditFees && !hasFeesProvided ? "amount" : "summary",
            transactionData: liveTx,
            useApp: options?.hwAppId,
            account,
            parentAccount,
            onResult: onSuccess,
            onCancel: onError,
          }),
        );
      },
      "transaction.broadcast": (account, parentAccount, mainAccount, optimisticOperation) => {
        dispatch(
          updateAccountWithUpdater(mainAccount.id, account =>
            addPendingOperation(account, optimisticOperation),
          ),
        );

        pushToast({
          id: optimisticOperation.id,
          type: "operation",
          title: t("platform.flows.broadcast.toast.title"),
          text: t("platform.flows.broadcast.toast.text"),
          icon: "info",
          callback: () => {
            tracking.broadcastOperationDetailsClick(manifest);
            setDrawer(OperationDetails, {
              operationId: optimisticOperation.id,
              accountId: account.id,
              parentId: parentAccount?.id,
            });
          },
        });
      },
      "device.transport": ({ appName, onSuccess, onCancel }) => {
        dispatch(
          openModal("MODAL_CONNECT_DEVICE", {
            appName,
            onResult: onSuccess,
            onCancel,
          }),
        );
      },
      "exchange.start": ({ exchangeType, onSuccess, onCancel }) => {
        dispatch(
          openModal("MODAL_PLATFORM_EXCHANGE_START", {
            exchangeType: ExchangeType[exchangeType],
            onResult: (nonce: string) => {
              onSuccess(nonce);
            },
            onCancel: (error: Error) => {
              onCancel(error);
            },
          }),
        );
      },
      "exchange.complete": ({ exchangeParams, onSuccess, onCancel }) => {
        dispatch(
          openModal("MODAL_PLATFORM_EXCHANGE_COMPLETE", {
            ...exchangeParams,
            onResult: (operation: Operation) => {
              onSuccess(operation.hash);
            },
            onCancel: (error: Error) => {
              console.error(error);
              onCancel(error);
            },
          }),
        );
      },
    }),
    [dispatch, manifest, pushToast, t],
  );
}

function useWebView({ manifest }: Pick<Props, "manifest">, webviewRef: RefObject<WebviewTag>) {
  const accounts = useSelector(flattenAccountsSelector);

  const uiHook = useUiHook(manifest);
  const shareAnalytics = useSelector(shareAnalyticsSelector);
  const config = useConfig({
    appId: manifest.id,
    userId: getEnv("USER_ID"),
    tracking: shareAnalytics,
    wallet,
  });

  const webviewHook = useMemo(() => {
    return {
      reload: () => webviewRef.current?.reloadIgnoringCache(),
      postMessage: (message: string) => {
        const webview = webviewRef.current;
        if (webview) {
          const origin = new URL(webview.src).origin;
          webview.contentWindow.postMessage(message, origin);
        }
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { widgetLoaded, onLoad, onReload, onMessage } = useWalletAPIServer({
    manifest,
    accounts,
    tracking,
    config,
    webviewHook,
    uiHook,
  });

  const handleMessage = useCallback(
    event => {
      if (event.channel === "webviewToParent") {
        onMessage(event.args[0]);
      }
    },
    [onMessage],
  );

  const handleDomReady = useCallback(() => {
    const webview = webviewRef.current;
    if (!webview) {
      return;
    }

    const id = webview.getWebContentsId();

    // cf. https://gist.github.com/codebytere/409738fcb7b774387b5287db2ead2ccb
    // @ts-expect-error: missing typings for api
    window.api.openWindow(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const webview = webviewRef.current;

    if (webview) {
      // For mysterious reasons, the webpreferences attribute does not
      // pass through the styled component when added in the JSX.
      webview.webpreferences = "nativeWindowOpen=no";
      webview.addEventListener("did-finish-load", onLoad);
      webview.addEventListener("ipc-message", handleMessage);
      webview.addEventListener("dom-ready", handleDomReady);
    }

    return () => {
      if (webview) {
        webview.removeEventListener("did-finish-load", onLoad);
        webview.removeEventListener("ipc-message", handleMessage);
        webview.removeEventListener("dom-ready", handleDomReady);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleDomReady, handleMessage, onLoad]);

  const webviewStyle = useMemo(() => {
    return {
      opacity: widgetLoaded ? 1 : 0,
      border: "none",
      width: "100%",
      flex: 1,
      transition: "opacity 200ms ease-out",
    };
  }, [widgetLoaded]);

  return { webviewRef, widgetLoaded, onReload, webviewStyle };
}

interface Props {
  manifest: AppManifest;
  inputs?: Record<string, string>;
}

export const WalletAPIWebview = forwardRef<WebviewAPI, WebviewProps>(
  ({ manifest, inputs = {}, onStateChange }, ref) => {
    const { webviewState, webviewRef, webviewProps } = useWebviewState({ manifest, inputs }, ref);

    useEffect(() => {
      if (onStateChange) {
        onStateChange(webviewState);
      }
    }, [webviewState, onStateChange]);

    const { webviewStyle, widgetLoaded } = useWebView(
      {
        manifest,
      },
      webviewRef,
    );

    return (
      <>
        <webview
          ref={webviewRef}
          /**
           * There seem to be an issue between Electron webview and styled-components
           * (and React more broadly, cf. comment below).
           * When using a styled webview componennt, the `allowpopups` prop does not
           * seem to be set
           */
          style={webviewStyle}
          preload={`file://${remote.app.dirname}/webviewPreloader.bundle.js`}
          /**
           * There seems to be an issue between Electron webview and react
           * Hence, the normal `allowpopups` prop does not work and we need to
           * explicitly set its value to "true" as a string
           * cf. https://github.com/electron/electron/issues/6046
           */
          // @ts-expect-error: see above comment
          allowpopups="true"
          {...webviewProps}
        />
        {!widgetLoaded ? (
          <Loader>
            <BigSpinner size={50} />
          </Loader>
        ) : null}
      </>
    );
  },
);

WalletAPIWebview.displayName = "WalletAPIWebview";
