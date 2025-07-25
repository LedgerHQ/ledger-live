import { JSONRPCRequest } from "json-rpc-2.0";
import React, { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { Operation, SignedOperation } from "@ledgerhq/types-live";
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
import { useJSONRPCServer } from "@ledgerhq/live-common/platform/JSONRPCServer";
import {
  RawPlatformSignedTransaction,
  RawPlatformTransaction,
} from "@ledgerhq/live-common/platform/rawTypes";
import {
  useListPlatformAccounts,
  useListPlatformCurrencies,
} from "@ledgerhq/live-common/platform/react";
import trackingWrapper from "@ledgerhq/live-common/platform/tracking";
import { openModal } from "../../actions/modals";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import BigSpinner from "../BigSpinner";
import { track } from "~/renderer/analytics/segment";
import {
  requestAccountLogic,
  broadcastTransactionLogic,
  RequestAccountParams,
} from "./LiveAppSDKLogic";
import { Loader } from "./styled";
import { WebviewAPI, WebviewProps } from "./types";
import { useWebviewState } from "./helpers";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { mevProtectionSelector } from "~/renderer/reducers/settings";
import { walletSelector } from "~/renderer/reducers/wallet";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { ModularDrawerLocation, useModularDrawerVisibility } from "LLD/features/ModularDrawer";

export const PlatformAPIWebview = forwardRef<WebviewAPI, WebviewProps>(
  ({ manifest, inputs = {}, onStateChange }, ref) => {
    const { webviewState, webviewRef, webviewProps, webviewPartition } = useWebviewState(
      { manifest, inputs },
      ref,
    );

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

    useEffect(() => {
      if (onStateChange) {
        onStateChange(webviewState);
      }
    }, [webviewState, onStateChange]);

    const dispatch = useDispatch();
    const accounts = useSelector(flattenAccountsSelector);
    const mevProtected = useSelector(mevProtectionSelector);
    const { pushToast } = useToasts();
    const { t } = useTranslation();

    const [widgetLoaded, setWidgetLoaded] = useState(false);

    const walletState = useSelector(walletSelector);
    const listAccounts = useListPlatformAccounts(walletState, accounts);
    const listCurrencies = useListPlatformCurrencies();

    const { isModularDrawerVisible } = useModularDrawerVisibility({
      modularDrawerFeatureFlagKey: "lldModularDrawer",
    });
    const modularDrawerVisible = isModularDrawerVisible(ModularDrawerLocation.LIVE_APP);

    const requestAccount = useCallback(
      (request: RequestAccountParams) => {
        return requestAccountLogic(walletState, { manifest }, request, modularDrawerVisible);
      },
      [walletState, manifest, modularDrawerVisible],
    );

    const receiveOnAccount = useCallback(
      ({ accountId }: { accountId: string }) =>
        receiveOnAccountLogic(
          walletState,
          { manifest, accounts, tracking },
          accountId,
          (account, parentAccount, accountAddress) => {
            // FIXME: handle address rejection (if user reject address, we don't end up in onResult nor in onCancel 🤔)
            return new Promise((resolve, reject) =>
              dispatch(
                openModal("MODAL_EXCHANGE_CRYPTO_DEVICE", {
                  account,
                  parentAccount,
                  onResult: () => {
                    tracking.platformReceiveSuccess(manifest);
                    resolve(accountAddress);
                  },
                  onCancel: error => {
                    tracking.platformReceiveFail(manifest);
                    reject(error);
                  },
                  onClose: () => {
                    tracking.platformReceiveFail(manifest);
                    reject(new UserRefusedOnDevice());
                  },
                  verifyAddress: true,
                }),
              ),
            );
          },
        ),
      [walletState, manifest, accounts, dispatch, tracking],
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
                  location: HOOKS_TRACKING_LOCATIONS.genericDAppTransactionSend,
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
      [manifest, dispatch, accounts, tracking],
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
          { manifest, dispatch, accounts, tracking, mevProtected },
          accountId,
          signedTransaction,
          pushToast,
          t,
        );
      },
      [manifest, accounts, pushToast, dispatch, t, tracking, mevProtected],
    );

    const startExchange = useCallback(
      ({ exchangeType }: { exchangeType: number }) => {
        tracking.platformStartExchangeRequested(manifest);

        return new Promise((resolve, reject) =>
          dispatch(
            openModal("MODAL_PLATFORM_EXCHANGE_START", {
              exchangeType,
              onResult: result => {
                tracking.platformStartExchangeSuccess(manifest);
                resolve(result.nonce);
              },
              onCancel: cancelResult => {
                tracking.platformStartExchangeFail(manifest);
                reject(cancelResult.error);
              },
            }),
          ),
        );
      },
      [manifest, dispatch, tracking],
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
      [accounts, dispatch, manifest, tracking],
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
                    reject(new UserRefusedOnDevice());
                  },
                }),
              );
            }),
        );
      },
      [accounts, dispatch, manifest, tracking],
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
      const webview = webviewRef.current;
      if (webview) {
        const origin = new URL(webview.src).origin;
        webview.contentWindow?.postMessage(JSON.stringify(request), origin);
      }

      return Promise.resolve();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [receive] = useJSONRPCServer(handlers, handleSend);

    const handleMessage = useCallback(
      (event: Electron.IpcMessageEvent) => {
        if (event.channel === "webviewToParent") {
          receive(JSON.parse(event.args[0]));
        }
      },
      [receive],
    );

    useEffect(() => {
      tracking.platformLoad(manifest);
      const webview = webviewRef.current;
      if (webview) {
        webview.addEventListener("ipc-message", handleMessage);
      }

      return () => {
        if (webview) {
          webview.removeEventListener("ipc-message", handleMessage);
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manifest, handleMessage]);

    const handleLoad = useCallback(() => {
      tracking.platformLoadSuccess(manifest);
      setWidgetLoaded(true);
    }, [manifest, tracking]);

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
        webview.addEventListener("did-finish-load", handleLoad);
        webview.addEventListener("dom-ready", handleDomReady);
      }

      return () => {
        if (webview) {
          webview.removeEventListener("did-finish-load", handleLoad);
          webview.removeEventListener("dom-ready", handleDomReady);
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleLoad, handleDomReady]);

    const webviewStyle = useMemo(() => {
      return {
        opacity: widgetLoaded ? 1 : 0,
        border: "none",
        width: "100%",
        flex: 1,
        transition: "opacity 200ms ease-out",
      };
    }, [widgetLoaded]);

    return (
      <>
        <webview
          ref={webviewRef}
          /**
           * There seems to be an issue between Electron webview and styled-components
           * (and React more broadly, cf. comment below).
           * When using a styled webview component, the `allowpopups` prop does not
           * seem to be set
           */
          style={webviewStyle}
          // eslint-disable-next-line react/no-unknown-property
          preload={`file://${window.api.appDirname}/webviewPreloader.bundle.js`}
          /**
           * There seems to be an issue between Electron webview and react
           * Hence, the normal `allowpopups` prop does not work and we need to
           * explicitly set its value to "true" as a string
           * cf. https://github.com/electron/electron/issues/6046
           */
          // @ts-expect-error: see above comment
          // eslint-disable-next-line react/no-unknown-property
          allowpopups="true"
          {...webviewProps}
          {...webviewPartition}
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

PlatformAPIWebview.displayName = "PlatformAPIWebview";
