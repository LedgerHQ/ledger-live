// @flow
import * as remote from "@electron/remote";
import {
  addPendingOperation,
  flattenAccounts,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getEnv } from "@ledgerhq/live-common/env";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import styled from "styled-components";
import { JSONRPCRequest } from "json-rpc-2.0";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import {
  useListPlatformAccounts,
  useListPlatformCurrencies,
  usePlatformUrl,
} from "@ledgerhq/live-common/platform/react";
import {
  accountToPlatformAccount,
  getPlatformTransactionSignFlowInfos,
} from "@ledgerhq/live-common/platform/converters";
import { useJSONRPCServer } from "@ledgerhq/live-common/platform/JSONRPCServer";
import type {
  RawPlatformSignedTransaction,
  RawPlatformTransaction,
} from "@ledgerhq/live-common/platform/rawTypes";
import {
  deserializePlatformSignedTransaction,
  deserializePlatformTransaction,
  serializePlatformAccount,
  serializePlatformSignedTransaction,
} from "@ledgerhq/live-common/platform/serializers";
import type { AppManifest } from "@ledgerhq/live-common/platform/types";
import { WebviewTag } from "electron";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { openModal } from "~/renderer/actions/modals";
import BigSpinner from "~/renderer/components/BigSpinner";
import Box from "~/renderer/components/Box";
import useTheme from "~/renderer/hooks/useTheme";
import { accountsSelector } from "~/renderer/reducers/accounts";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import TopBar from "./TopBar";
import * as tracking from "./tracking";
import type { TopBarConfig } from "./type";
import { handleMessageEvent, handleNewWindowEvent } from "./utils";
import logger from "~/logger";
import { prepareMessageToSign } from "@ledgerhq/live-common/hw/signMessage/index";
import type { MessageData } from "@ledgerhq/live-common/hw/signMessage/types";

const Container: ThemedComponent<{}> = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
`;

// $FlowFixMe
const CustomWebview: ThemedComponent<{}> = styled("webview")`
  border: none;
  width: 100%;
  flex: 1;
  transition: opacity 200ms ease-out;
`;

const Wrapper: ThemedComponent<{}> = styled(Box).attrs(() => ({
  flex: 1,
}))`
  position: relative;
`;

const Loader: ThemedComponent<{}> = styled.div`
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
  manifest: AppManifest,
  onClose?: Function,
  inputs?: Object,
  config?: WebPlatformPlayerConfig,
};

export default function WebPlatformPlayer({ manifest, onClose, inputs, config }: Props) {
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

  const receiveOnAccount = useCallback(
    ({ accountId }: { accountId: string }) => {
      const account = accounts.find(account => account.id === accountId);
      tracking.platformReceiveRequested(manifest);

      // FIXME: handle address rejection (if user reject address, we don't end up in onResult nor in onCancel 🤔)
      return new Promise((resolve, reject) =>
        dispatch(
          openModal("MODAL_EXCHANGE_CRYPTO_DEVICE", {
            account,
            parentAccount: null,
            onResult: account => {
              tracking.platformReceiveSuccess(manifest);
              resolve(account.freshAddress);
            },
            onCancel: error => {
              tracking.platformReceiveFail(manifest);
              reject(error);
            },
            verifyAddress: true,
          }),
        ),
      );
    },
    [manifest, accounts, dispatch],
  );

  const broadcastTransaction = useCallback(
    async ({
      accountId,
      signedTransaction,
    }: {
      accountId: string,
      signedTransaction: RawPlatformSignedTransaction,
    }) => {
      const account = accounts.find(account => account.id === accountId);
      if (!account) return null;

      const signedOperation = deserializePlatformSignedTransaction(signedTransaction, accountId);
      const bridge = getAccountBridge(account);

      let optimisticOperation = signedOperation.operation;

      // FIXME: couldn't we use `useBroadcast` here?
      if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
        try {
          optimisticOperation = await bridge.broadcast({
            account,
            signedOperation,
          });
          tracking.platformBroadcastSuccess(manifest);
        } catch (error) {
          tracking.platformBroadcastFail(manifest);
          throw error;
        }
      }

      dispatch(
        updateAccountWithUpdater(account.id, account =>
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
          tracking.platformBroadcastOperationDetailsClick(manifest);
          dispatch(
            openModal("MODAL_OPERATION_DETAILS", {
              operationId: optimisticOperation.id,
              accountId: account.id,
              parentId: null,
            }),
          );
        },
      });

      return optimisticOperation.hash;
    },
    [manifest, accounts, pushToast, dispatch, t],
  );

  const requestAccount = useCallback(
    ({
      currencies,
      allowAddAccount,
      includeTokens,
    }: {
      currencies?: string[],
      allowAddAccount?: boolean,
      includeTokens?: boolean,
    }) => {
      tracking.platformRequestAccountRequested(manifest);
      return new Promise((resolve, reject) =>
        dispatch(
          openModal("MODAL_REQUEST_ACCOUNT", {
            currencies,
            allowAddAccount,
            includeTokens,
            onResult: account => {
              tracking.platformRequestAccountSuccess(manifest);
              /**
               * If account does not exist, it means one (or multiple) account(s) have been created
               * In this case, to notify the user of the API that an account has been created,
               * and that he should refetch the accounts list, we return an empty object
               * (that will be deserialized as an empty Account object in the SDK)
               *
               * FIXME: this overall handling of created accounts could be improved and might not handle "onCancel"
               */
              //
              resolve(serializePlatformAccount(accountToPlatformAccount(account, accounts)));
            },
            onCancel: error => {
              tracking.platformRequestAccountFail(manifest);
              reject(error);
            },
          }),
        ),
      );
    },
    [manifest, dispatch, accounts],
  );

  const signTransaction = useCallback(
    ({
      accountId,
      transaction,
      params = {},
    }: {
      accountId: string,
      transaction: RawPlatformTransaction,
      params: any,
    }) => {
      const platformTransaction = deserializePlatformTransaction(transaction);

      const account = accounts.find(account => account.id === accountId);

      if (!account) return null;

      const parentAccount =
        account.type === "TokenAccount" ? accounts.find(a => a.id === account.parentId) : undefined;

      if (
        (account.type === "TokenAccount"
          ? parentAccount?.currency.family
          : account.currency.family) !== platformTransaction.family
      ) {
        throw new Error("Transaction family not matching account currency family");
      }

      tracking.platformSignTransactionRequested(manifest);

      const { canEditFees, liveTx, hasFeesProvided } = getPlatformTransactionSignFlowInfos(
        platformTransaction,
      );

      return new Promise((resolve, reject) =>
        dispatch(
          openModal("MODAL_SIGN_TRANSACTION", {
            canEditFees,
            stepId: canEditFees && !hasFeesProvided ? "amount" : "summary",
            transactionData: liveTx,
            useApp: params.useApp,
            account,
            parentAccount,
            onResult: signedOperation => {
              tracking.platformSignTransactionRequested(manifest);
              resolve(serializePlatformSignedTransaction(signedOperation));
            },
            onCancel: error => {
              tracking.platformSignTransactionFail(manifest);
              reject(error);
            },
          }),
        ),
      );
    },
    [manifest, dispatch, accounts],
  );

  const startExchange = useCallback(
    ({ exchangeType }: { exchangeType: number }) => {
      tracking.platformStartExchangeRequested(manifest);
      return new Promise((resolve, reject) =>
        dispatch(
          openModal("MODAL_PLATFORM_EXCHANGE_START", {
            exchangeType,
            onResult: nonce => {
              tracking.platformStartExchangeSuccess(manifest);
              resolve(nonce);
            },
            onCancel: error => {
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
    ({
      provider,
      fromAccountId,
      toAccountId,
      transaction,
      binaryPayload,
      signature,
      feesStrategy,
      exchangeType,
    }: {
      provider: string,
      fromAccountId: string,
      toAccountId: string,
      transaction: RawPlatformTransaction,
      binaryPayload: string,
      signature: string,
      feesStrategy: string,
      exchangeType: number,
    }) => {
      // Nb get a hold of the actual accounts, and parent accounts
      const fromAccount = accounts.find(a => a.id === fromAccountId);
      let fromParentAccount;

      const toAccount = accounts.find(a => a.id === toAccountId);
      let toParentAccount;

      if (!fromAccount) {
        return null;
      }

      if (exchangeType === 0x00 && !toAccount) {
        // if we do a swap, a destination account must be provided
        return null;
      }

      if (fromAccount.type === "TokenAccount") {
        fromParentAccount = accounts.find(a => a.id === fromAccount.parentId);
      }
      if (toAccount && toAccount.type === "TokenAccount") {
        toParentAccount = accounts.find(a => a.id === toAccount.parentId);
      }

      const accountBridge = getAccountBridge(fromAccount, fromParentAccount);
      const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);

      transaction.family = mainFromAccount.currency.family;

      const platformTransaction = deserializePlatformTransaction(transaction);

      platformTransaction.feesStrategy = feesStrategy;

      let processedTransaction = accountBridge.createTransaction(mainFromAccount);
      processedTransaction = accountBridge.updateTransaction(
        processedTransaction,
        platformTransaction,
      );

      tracking.platformCompleteExchangeRequested(manifest);
      return new Promise((resolve, reject) =>
        dispatch(
          openModal("MODAL_PLATFORM_EXCHANGE_COMPLETE", {
            provider,
            exchange: {
              fromAccount,
              fromParentAccount,
              toAccount,
              toParentAccount,
            },
            transaction: processedTransaction,
            binaryPayload,
            signature,
            feesStrategy,
            exchangeType,

            onResult: operation => {
              tracking.platformCompleteExchangeSuccess(manifest);
              resolve(operation);
            },
            onCancel: error => {
              tracking.platformCompleteExchangeFail(manifest);
              reject(error);
            },
          }),
        ),
      );
    },
    [accounts, dispatch, manifest],
  );

  const signMessage = useCallback(
    ({ accountId, message }: { accountId: string, message: string }) => {
      const account = accounts.find(account => account.id === accountId);

      let formattedMessage: MessageData | null;
      try {
        formattedMessage = prepareMessageToSign(account, message);
      } catch (error) {
        return Promise.reject(error);
      }

      return new Promise((resolve, reject) => {
        dispatch(
          openModal("MODAL_SIGN_MESSAGE", {
            message: formattedMessage,
            account,
            onConfirmationHandler: signature => {
              logger.info("Signature done");
              resolve(signature);
            },
            onFailHandler: err => {
              logger.error(err);
              reject(err);
            },
            onClose: () => {
              reject(new Error("Signature aborted by user"));
            },
          }),
        );
      });
    },
    [accounts, dispatch],
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

  const handleSend = useCallback(
    (request: JSONRPCRequest) => {
      const webview = targetRef.current;
      if (webview) {
        webview.contentWindow.postMessage(JSON.stringify(request), url.origin);
      }
    },
    [url],
  );

  const [receive] = useJSONRPCServer(handlers, handleSend);

  const handleMessage = useCallback(event => handleMessageEvent({ event, handler: receive }), [
    receive,
  ]);

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

  const handleNewWindow = useCallback(handleNewWindowEvent, []);

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
}
