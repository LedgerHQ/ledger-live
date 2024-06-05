/* eslint-disable react/prop-types */

import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { TrackFunction } from "@ledgerhq/live-common/platform/tracking";
import {
  ExchangeType,
  UiHook,
  useConfig,
  useWalletAPIServer,
} from "@ledgerhq/live-common/wallet-api/react";
import trackingWrapper, { TrackingAPI } from "@ledgerhq/live-common/wallet-api/tracking";
import { AppManifest, WalletAPIServer } from "@ledgerhq/live-common/wallet-api/types";
import { useDappLogic } from "@ledgerhq/live-common/wallet-api/useDappLogic";
import { Operation } from "@ledgerhq/types-live";
import { ipcRenderer } from "electron";
import React, {
  RefObject,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import getUser from "~/helpers/user";
import { openExchangeDrawer } from "~/renderer/actions/UI";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { track } from "~/renderer/analytics/segment";
import SelectAccountAndCurrencyDrawer from "~/renderer/drawers/DataSelector/SelectAccountAndCurrencyDrawer";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { shareAnalyticsSelector } from "~/renderer/reducers/settings";
import { walletSelector } from "~/renderer/reducers/wallet";
import { getStoreValue, setStoreValue } from "~/renderer/store";
import { updateAccountWithUpdater } from "../../actions/accounts";
import { openModal } from "../../actions/modals";
import { flattenAccountsSelector } from "../../reducers/accounts";
import BigSpinner from "../BigSpinner";
import { NetworkErrorScreen } from "./NetworkError";
import { NoAccountOverlay } from "./NoAccountOverlay";
import { useWebviewState } from "./helpers";
import { Loader } from "./styled";
import { WebviewAPI, WebviewProps, WebviewTag } from "./types";

const wallet = { name: "ledger-live-desktop", version: __APP_VERSION__ };

function useUiHook(manifest: AppManifest, tracking: Record<string, TrackFunction>): UiHook {
  const { pushToast } = useToasts();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  return useMemo(
    () => ({
      "account.request": ({ accounts$, currencies, onSuccess, onCancel }) => {
        ipcRenderer.send("show-app", {});
        setDrawer(
          SelectAccountAndCurrencyDrawer,
          {
            currencies,
            onAccountSelected: (account, parentAccount) => {
              setDrawer();
              onSuccess(account, parentAccount);
            },
            accounts$,
          },
          {
            onRequestClose: () => {
              setDrawer();
              onCancel();
            },
          },
        );
      },
      "account.receive": ({ account, parentAccount, accountAddress, onSuccess, onError }) => {
        ipcRenderer.send("show-app", {});
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
        ipcRenderer.send("show-app", {});
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
        return getStoreValue(key, storeId) as string | undefined;
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
        ipcRenderer.send("show-app", {});
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
            manifestId: manifest.id,
            manifestName: manifest.name,
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
              parentId: parentAccount?.id as string | undefined | null,
            });
          },
        });
      },
      "device.transport": ({ appName, onSuccess, onCancel }) => {
        ipcRenderer.send("show-app", {});
        dispatch(
          openModal("MODAL_CONNECT_DEVICE", {
            appName,
            onResult: onSuccess,
            onCancel,
          }),
        );
      },
      "device.select": ({ appName, onSuccess, onCancel }) => {
        ipcRenderer.send("show-app", {});
        dispatch(
          openModal("MODAL_CONNECT_DEVICE", {
            appName,
            onResult: onSuccess,
            onCancel,
          }),
        );
      },
      "exchange.start": ({ exchangeType, onSuccess, onCancel }) => {
        ipcRenderer.send("show-app", {});
        dispatch(
          openExchangeDrawer({
            type: "EXCHANGE_START",
            exchangeType: ExchangeType[exchangeType],
            onResult: result => {
              onSuccess(result.nonce);
            },
            onCancel: cancelResult => {
              onCancel(cancelResult.error);
            },
          }),
        );
      },
      "exchange.complete": ({ exchangeParams, onSuccess, onCancel }) => {
        ipcRenderer.send("show-app", {});
        dispatch(
          openExchangeDrawer({
            type: "EXCHANGE_COMPLETE",
            ...exchangeParams,
            onResult: (operation: Operation) => {
              onSuccess(operation.hash);
            },
            onCancel: (error: Error) => {
              onCancel(error);
            },
          }),
        );
      },
    }),
    [dispatch, manifest, pushToast, t, tracking],
  );
}

const useGetUserId = () => {
  const [userId, setUserId] = useState("");

  useEffect(() => {
    let mounted = true;
    getUser().then(({ id }) => {
      if (mounted) setUserId(id);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return userId;
};

function useWebView(
  {
    manifest,
    customHandlers,
    currentAccountHistDb,
  }: Pick<WebviewProps, "manifest" | "customHandlers" | "currentAccountHistDb">,
  webviewRef: RefObject<WebviewTag>,
  tracking: TrackingAPI,
  serverRef: React.MutableRefObject<WalletAPIServer | undefined>,
) {
  const accounts = useSelector(flattenAccountsSelector);

  const uiHook = useUiHook(manifest, tracking);
  const shareAnalytics = useSelector(shareAnalyticsSelector);
  const userId = useGetUserId();
  const config = useConfig({
    appId: manifest.id,
    userId,
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
          webview.contentWindow?.postMessage(message, origin);
        }
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const walletState = useSelector(walletSelector);

  const { widgetLoaded, onLoad, onReload, onMessage, server } = useWalletAPIServer({
    walletState,
    manifest,
    accounts,
    tracking,
    config,
    webviewHook,
    uiHook,
    customHandlers,
  });

  useEffect(() => {
    serverRef.current = server;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server]);

  const { onDappMessage, noAccounts } = useDappLogic({
    manifest,
    accounts,
    uiHook,
    postMessage: webviewHook.postMessage,
    currentAccountHistDb,
    tracking,
  });

  const handleMessage = useCallback(
    (event: Electron.IpcMessageEvent) => {
      if (event.channel === "webviewToParent") {
        onMessage(event.args[0]);
      }
      if (event.channel === "dappToParent") {
        onDappMessage(event.args[0]);
      }
    },
    [onDappMessage, onMessage],
  );

  const handleDomReady = useCallback(() => {
    const webview = webviewRef.current;
    if (!webview) {
      return;
    }

    const id = webview.getWebContentsId();

    // cf. https://gist.github.com/codebytere/409738fcb7b774387b5287db2ead2ccb
    window.api?.openWindow(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const webview = webviewRef.current;

    if (webview) {
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
      height: "100%",
      flex: 1,
      transition: "opacity 200ms ease-out",
    };
  }, [widgetLoaded]);

  return { webviewRef, widgetLoaded, onReload, webviewStyle, noAccounts };
}

export const WalletAPIWebview = forwardRef<WebviewAPI, WebviewProps>(
  (
    { manifest, inputs = {}, currentAccountHistDb, customHandlers, onStateChange, hideLoader },
    ref,
  ) => {
    const tracking = useMemo(
      () =>
        trackingWrapper(
          (
            eventName: string,
            properties?: Record<string, unknown> | null,
            mandatory?: boolean | null,
          ) =>
            track(
              eventName,
              {
                ...properties,
                flowInitiatedFrom:
                  currentRouteNameRef.current === "Platform Catalog"
                    ? "Discover"
                    : currentRouteNameRef.current,
              },
              mandatory,
            ),
        ),
      [],
    );

    const serverRef = useRef<WalletAPIServer>();

    const { webviewState, webviewRef, webviewProps, handleRefresh } = useWebviewState(
      { manifest, inputs },
      ref,
      serverRef,
    );
    useEffect(() => {
      if (onStateChange) {
        onStateChange(webviewState);
      }
    }, [webviewState, onStateChange]);

    const { webviewStyle, widgetLoaded, noAccounts } = useWebView(
      {
        manifest,
        customHandlers,
        currentAccountHistDb,
      },
      webviewRef,
      tracking,
      serverRef,
    );

    const isDapp = !!manifest.dapp;
    const preloader = isDapp ? "webviewDappPreloader" : "webviewPreloader";

    if (isDapp && noAccounts) {
      return <NoAccountOverlay manifest={manifest} currentAccountHistDb={currentAccountHistDb} />;
    }

    return (
      <>
        {!webviewState.loading && webviewState.isAppUnavailable && (
          <NetworkErrorScreen refresh={handleRefresh} />
        )}
        <webview
          ref={webviewRef}
          /**
           * There seem to be an issue between Electron webview and styled-components
           * (and React more broadly, cf. comment below).
           * When using a styled webview componennt, the `allowpopups` prop does not
           * seem to be set
           */
          style={webviewStyle}
          // eslint-disable-next-line react/no-unknown-property
          preload={`file://${window.api.appDirname}/${preloader}.bundle.js`}
          /**
           * There seems to be an issue between Electron webview and react
           * Hence, the normal `allowpopups` prop does not work and we need to
           * explicitly set its value to "true" as a string
           * cf. https://github.com/electron/electron/issues/6046
           */
          // @ts-expect-error: see above comment
          // eslint-disable-next-line react/no-unknown-property
          allowpopups="true"
          // eslint-disable-next-line react/no-unknown-property
          webpreferences={`nativeWindowOpen=no${isDapp ? ", contextIsolation=no" : ""}`}
          {...webviewProps}
        />
        {!widgetLoaded && !hideLoader ? (
          <Loader>
            <BigSpinner size={50} />
          </Loader>
        ) : null}
      </>
    );
  },
);

WalletAPIWebview.displayName = "WalletAPIWebview";
