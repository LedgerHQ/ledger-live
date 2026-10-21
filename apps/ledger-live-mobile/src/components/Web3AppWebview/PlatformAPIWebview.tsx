import { track } from "@shared/analytics";
import React, { useState, useCallback, useEffect, useMemo, forwardRef } from "react";
import { useSelector } from "~/context/hooks";
import { appVersion } from "LLM/utils/appVersion";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { WebView as RNWebView, WebViewMessageEvent } from "react-native-webview";
import { useNavigation, useRoute } from "@react-navigation/native";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import type {
  RawPlatformTransaction,
  RawPlatformSignedTransaction,
  RawPlatformAccount,
} from "@ledgerhq/live-common/platform/rawTypes";
import { getEnv } from "@shared/env";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  broadcastTransactionLogic,
  receiveOnAccountLogic,
  signTransactionLogic,
  completeExchangeLogic,
  signMessageLogic,
} from "@ledgerhq/live-common/platform/logic";
import { useJSONRPCServer } from "@ledgerhq/live-common/platform/JSONRPCServer";
import { withPlatformAPIPermissions } from "@ledgerhq/live-common/platform/permissions";
import { accountToPlatformAccount } from "@ledgerhq/live-common/platform/converters";
import {
  serializePlatformAccount,
  serializePlatformSignedTransaction,
} from "@ledgerhq/live-common/platform/serializers";
import {
  useListPlatformAccounts,
  useListPlatformCurrencies,
} from "@ledgerhq/live-common/platform/react";
import trackingWrapper from "@ledgerhq/live-common/platform/tracking";
import { INTERNAL_APP_IDS } from "@ledgerhq/live-common/wallet-api/constants";
import { useInternalAppIds } from "@ledgerhq/live-common/hooks/useInternalAppIds";
import { useFeature } from "@features/platform-feature-flags";
import { useFeatureFlaggedCurrencies } from "@features/platform-currencies";
import useEnv from "@features/platform-env";
import { NavigatorName, ScreenName } from "~/const";
import { broadcastSignedTx } from "~/logic/screenTransactionHooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import prepareSignTransaction from "./liveSDKLogic";
import { RootNavigationComposite, StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { WebviewAPI, WebviewProps } from "./types";
import { BridgeSessionClosed } from "@ledgerhq/live-common/errors";
import type { BridgeSession } from "@ledgerhq/live-common/wallet-api/bridgeSession";
import { useWebviewState } from "./helpers";
import {
  acceptWebviewMessage,
  getMessagingAllowedOrigins,
  useBridgeAllowedDomains,
  useWebviewBridgeSession,
} from "./bridge";
import { closePlatformExchange } from "./closePlatformExchange";
import { closeLiveAppFlows } from "./closeLiveAppFlows";
import { getTrackingRouteLiveAppSource } from "./analytics";
import { reportIfStrictlyDisallowed } from "./domainCheckReport";
import { NetworkError } from "./NetworkError";
import {
  MANIFEST_DOMAIN_CHECK_ORIGIN_WHITELIST,
  openWindowExternally,
} from "./manifestDomainGuard";
import { walletSelector } from "~/reducers/wallet";
import { WebViewOpenWindowEvent } from "react-native-webview/lib/WebViewTypes";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { isPlatformSupportedCurrency } from "@ledgerhq/live-common/platform/helpers";
import Config from "react-native-config";
import {
  E2E_WEBVIEW_CONSOLE_LOG_TYPE,
  E2E_WEBVIEW_NETWORK_CAPTURE_SCRIPT,
  E2E_WEBVIEW_NETWORK_LOG_TYPE,
} from "~/e2e/webviewNetworkLogCapture";
import { webviewLogStore } from "~/e2e/webviewLogStore";

const APPLICATION_NAME = `ledgerlivemobile/${appVersion} llm-${Platform.OS}/${appVersion}`;

function renderLoading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="small" />
    </View>
  );
}
export const PlatformAPIWebview = forwardRef<WebviewAPI, WebviewProps>(
  ({ manifest, inputs = {}, onStateChange, onScroll }, ref) => {
    const tracking = useMemo(
      () =>
        trackingWrapper((eventName: string, properties?: Record<string, unknown> | null) =>
          track(eventName, {
            ...properties,
            flowInitiatedFrom: getTrackingRouteLiveAppSource(),
          }),
        ),
      [],
    );

    const manifestDomainCheckEnabled = useFeature("llmWebviewManifestDomainCheck")?.enabled;
    const enforcePermissions = !!useFeature("platformApiEnforcePermissions")?.enabled;

    const {
      webviewProps,
      webviewRef,
      onShouldStartLoadWithRequest,
      isBlockedByDomainCheck,
      mainFrameUrl,
    } = useWebviewState(
      {
        manifest,
        inputs,
        manifestDomainCheckEnabled,
      },
      ref,
      onStateChange,
    );

    const walletState = useSelector(walletSelector);

    const accounts = useSelector(flattenAccountsSelector);
    const navigation =
      useNavigation<
        RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>
      >();
    const route = useRoute();
    const [device, setDevice] = useState<Device>();
    const listAccounts = useListPlatformAccounts(walletState.accountNames, accounts);
    const { deactivatedCurrencyIds } = useFeatureFlaggedCurrencies(!!useEnv("MOCK"));
    const deactivatedCurrencyIdsSet = useMemo(
      () => new Set(deactivatedCurrencyIds),
      [deactivatedCurrencyIds],
    );
    const listPlatformCurrencies = useListPlatformCurrencies(deactivatedCurrencyIdsSet);

    const {
      openDrawer: openModularDrawer,
      closeDrawer: closeModularDrawer,
      isOpen: isModularDrawerOpen,
    } = useModularDrawerController();

    // The drawer and flows a Live App opened are closed when its main frame moves to another
    // origin, and the device of its exchange is forgotten.
    const closeLiveAppFlowsAndDrawers = useCallback(() => {
      if (isModularDrawerOpen) {
        closeModularDrawer();
      }
      setDevice(undefined);
      closeLiveAppFlows(navigation, route.key);
    }, [closeModularDrawer, isModularDrawerOpen, navigation, route.key]);

    const bridge = useWebviewBridgeSession(webviewRef, mainFrameUrl, closeLiveAppFlowsAndDrawers);
    const allowedDomains = useBridgeAllowedDomains(manifest.domains, manifestDomainCheckEnabled);
    const messagingAllowedOrigins = useMemo(
      () => getMessagingAllowedOrigins(allowedDomains),
      [allowedDomains],
    );

    const requestAccount = useCallback(
      ({
        currencies,
        includeTokens,
      }: // TODO: use type RequestAccountParams from LedgerLiveApiSdk
      // }: RequestAccountParams) =>
      {
        currencies?: string[];
        allowAddAccount?: boolean;
        includeTokens?: boolean;
      }): Promise<RawPlatformAccount> =>
        new Promise(resolve => {
          tracking.platformRequestAccountRequested(manifest);

          /**
           * make sure currencies are strings
           * PS: yes `currencies` is properly typed as `string[]` but this typing only
           * works at build time and the `currencies` array is received at runtime from
           * JSONRPC requests. So we need to make sure the array is properly typed.
           */
          const cryptoCurrencyIds = currencies?.filter(c => typeof c === "string") ?? undefined;
          const currencyIds =
            !includeTokens && !cryptoCurrencyIds
              ? listSupportedCurrencies().reduce<string[]>((acc, currency) => {
                  if (
                    isPlatformSupportedCurrency(currency) &&
                    !deactivatedCurrencyIds.has(currency.id)
                  )
                    acc.push(currency.id);
                  return acc;
                }, [])
              : cryptoCurrencyIds;

          const onSuccess = (account: AccountLike, parentAccount?: Account) => {
            tracking.platformRequestAccountSuccess(manifest);
            resolve(
              serializePlatformAccount(
                accountToPlatformAccount(walletState.accountNames, account, parentAccount),
              ),
            );
          };

          openModularDrawer({
            currencies: currencyIds,
            areCurrenciesFiltered: currencyIds && currencyIds.length > 0,
            enableAccountSelection: true,
            onAccountSelected: onSuccess,
            flow: manifest.name,
            source: getTrackingRouteLiveAppSource(),
          });
        }),
      [tracking, manifest, deactivatedCurrencyIds, walletState.accountNames, openModularDrawer],
    );

    const receiveOnAccount = useCallback(
      ({ accountId }: { accountId: string }) =>
        receiveOnAccountLogic(
          walletState.accountNames,
          { manifest, accounts, tracking },
          accountId,
          (account, parentAccount, accountAddress) =>
            new Promise((resolve, reject) => {
              navigation.navigate(ScreenName.VerifyAccount, {
                account,
                parentId: parentAccount ? parentAccount.id : undefined,
                onSuccess: (_account: AccountLike) => {
                  tracking.platformReceiveSuccess(manifest);
                  resolve(accountAddress);
                },
                onClose: () => {
                  tracking.platformReceiveFail(manifest);
                  reject(new Error("User cancelled"));
                },
                onError: (error: Error) => {
                  tracking.platformReceiveFail(manifest);
                  // @TODO put in correct error text maybe
                  reject(error);
                },
              });
            }),
        ),
      [walletState.accountNames, manifest, accounts, navigation, tracking],
    );

    const signTransaction = useCallback(
      (
        {
          accountId,
          transaction,
          params,
        }: // TODO: use type SignTransactionParams from LedgerLiveApiSdk
        // }: SignTransactionParams) => {
        {
          accountId: string;
          transaction: RawPlatformTransaction;
          params?: {
            /**
             * The name of the Ledger Nano app to use for the signing process
             */
            useApp: string;
          };
        },
        session: BridgeSession,
      ) =>
        signTransactionLogic(
          { manifest, accounts, tracking },
          accountId,
          transaction,
          session.whileOpen(async (account, parentAccount, { liveTx }) => {
            let tx: Transaction;
            try {
              tx = await prepareSignTransaction(account, parentAccount, liveTx);
            } catch (error) {
              tracking.platformSignTransactionFail(manifest);
              throw error;
            }
            if (!session.isOpen) throw new BridgeSessionClosed();

            return new Promise((resolve, reject) => {
              let done = false;

              const onError = (error: Error) => {
                if (done) return;
                done = true;
                tracking.platformSignTransactionFail(manifest);
                reject(error);
              };

              navigation.navigate(NavigatorName.SignTransaction, {
                screen: ScreenName.SignTransactionSummary,
                params: {
                  currentNavigation: ScreenName.SignTransactionSummary,
                  nextNavigation: ScreenName.SignTransactionSelectDevice,
                  transaction: tx,
                  accountId,
                  parentId: parentAccount?.id,
                  appName: params?.useApp,
                  onSuccess: async signedOperation => {
                    if (done) return;
                    done = true;
                    tracking.platformSignTransactionSuccess(manifest);
                    resolve(await serializePlatformSignedTransaction(signedOperation));
                  },
                  onError,
                },
                onError,
              });
            });
          }),
        ),
      [manifest, accounts, navigation, tracking],
    );

    const broadcastTransaction = useCallback(
      (
        {
          accountId,
          signedTransaction,
        }: {
          accountId: string;
          signedTransaction: RawPlatformSignedTransaction;
        },
        session: BridgeSession,
      ) =>
        broadcastTransactionLogic(
          { manifest, accounts, tracking },
          accountId,
          signedTransaction,
          session.whileOpen(async (account, parentAccount, signedOperation) => {
            let optimisticOperation: Operation = signedOperation.operation;

            if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
              try {
                optimisticOperation = await broadcastSignedTx(
                  account,
                  parentAccount,
                  signedOperation,
                );
                tracking.platformBroadcastSuccess(manifest);
              } catch (error) {
                tracking.platformBroadcastFail(manifest);
                throw error;
              }
            }

            return optimisticOperation.hash;
          }),
        ),
      [manifest, accounts, tracking],
    );

    const startExchange = useCallback(
      (
        { exchangeType, provider }: { exchangeType: number; provider?: string },
        session: BridgeSession,
      ) => {
        tracking.platformStartExchangeRequested(manifest);

        return new Promise((resolve, reject) => {
          navigation.navigate(NavigatorName.PlatformExchange, {
            screen: ScreenName.PlatformStartExchange,
            params: {
              request: {
                exchangeType,
                provider,
              },
              onResult: result => {
                if (result.startExchangeError) {
                  tracking.platformStartExchangeFail(manifest);
                  reject(result.startExchangeError.error);
                }

                if (result.startExchangeResult) {
                  tracking.platformStartExchangeSuccess(manifest);
                  if (session.isOpen) setDevice(result.device);
                  resolve(result.startExchangeResult.nonce);
                }

                closePlatformExchange(navigation);
              },
            },
          });
        });
      },
      [manifest, navigation, tracking],
    );

    const completeExchange = useCallback(
      (
        request: {
          provider: string;
          fromAccountId: string;
          toAccountId: string;
          transaction: RawPlatformTransaction;
          binaryPayload: string;
          signature: string;
          feesStrategy: string;
          exchangeType: number;
          amountExpectedTo?: number;
        },
        session: BridgeSession,
      ) =>
        completeExchangeLogic(
          { manifest, accounts, tracking },
          request,
          session.whileOpen(
            ({
              provider,
              exchange,
              transaction,
              binaryPayload,
              signature,
              feesStrategy,
              exchangeType,
            }): Promise<Operation> =>
              new Promise((resolve, reject) => {
                navigation.navigate(NavigatorName.PlatformExchange, {
                  screen: ScreenName.PlatformCompleteExchange,
                  params: {
                    request: {
                      exchangeType,
                      provider,
                      exchange,
                      transaction: transaction as Transaction,
                      binaryPayload,
                      signature,
                      feesStrategy,
                    },
                    device,
                    onResult: (result: { operation?: Operation; error?: Error }) => {
                      if (result.error) {
                        tracking.platformStartExchangeFail(manifest);
                        reject(result.error);
                      }
                      if (result.operation) {
                        tracking.platformStartExchangeSuccess(manifest);
                        resolve(result.operation);
                      }
                      if (session.isOpen) setDevice(undefined);
                      closePlatformExchange(navigation);
                    },
                  },
                });
              }),
          ),
        ),
      [accounts, manifest, navigation, device, tracking],
    );

    const signMessage = useCallback(
      ({ accountId, message }: { accountId: string; message: string }, session: BridgeSession) =>
        signMessageLogic(
          { manifest, accounts, tracking },
          accountId,
          message,
          session.whileOpen(
            ({ id: accountId }, message) =>
              new Promise((resolve, reject) => {
                navigation.navigate(NavigatorName.SignMessage, {
                  screen:
                    message.standard === "EIP712"
                      ? ScreenName.SignSelectDevice
                      : ScreenName.SignSummary,
                  params: {
                    message,
                    accountId,
                    onConfirmationHandler: (message: string) => {
                      tracking.platformSignMessageSuccess(manifest);
                      resolve(message);
                    },
                    onFailHandler: (error: Error) => {
                      tracking.platformSignMessageFail(manifest);
                      reject(error);
                    },
                  },
                  onClose: () => {
                    tracking.platformSignMessageUserRefused(manifest);
                    reject(new UserRefusedOnDevice());
                  },
                });
              }),
          ),
        ),
      [accounts, manifest, navigation, tracking],
    );

    const handlers = useMemo(
      () =>
        withPlatformAPIPermissions(
          {
            "account.list": listAccounts,
            "currency.list": listPlatformCurrencies,
            "account.request": requestAccount,
            "account.receive": receiveOnAccount,
            "transaction.sign": signTransaction,
            "transaction.broadcast": broadcastTransaction,
            "exchange.start": startExchange,
            "exchange.complete": completeExchange,
            "message.sign": signMessage,
          },
          manifest,
          enforcePermissions,
        ),
      [
        manifest,
        enforcePermissions,
        listAccounts,
        listPlatformCurrencies,
        requestAccount,
        receiveOnAccount,
        signTransaction,
        broadcastTransaction,
        startExchange,
        completeExchange,
        signMessage,
      ],
    );
    useJSONRPCServer(handlers, bridge.session);

    const { accept } = bridge;
    const handleMessage = useCallback(
      (e: WebViewMessageEvent) => {
        const data = e.nativeEvent?.data;
        if (!data) return;
        reportIfStrictlyDisallowed({
          manifest,
          url: e.nativeEvent.url,
          frameType: "unknown",
          kind: "bridge",
        });

        if (Config.DETOX) {
          try {
            const msg = JSON.parse(data);
            if (msg.type === E2E_WEBVIEW_NETWORK_LOG_TYPE) {
              webviewLogStore.addNetworkLog(msg.payload);
              return;
            }
            if (msg.type === E2E_WEBVIEW_CONSOLE_LOG_TYPE) {
              webviewLogStore.addConsoleLog(msg.payload);
              return;
            }
          } catch {
            // Not an E2E log: handled below.
          }
        }

        acceptWebviewMessage(e, allowedDomains, accept)?.receive(data);
      },
      [accept, allowedDomains, manifest],
    );

    const handleError = useCallback(
      (event?: { nativeEvent?: { description?: string; code?: number } }) => {
        if (Config.DETOX) {
          const desc = event?.nativeEvent?.description;
          const code = event?.nativeEvent?.code;
          webviewLogStore.addLoadError({
            timestamp: new Date().toISOString(),
            source: "PlatformAPIWebview",
            message: desc ?? "WebView onError fired",
            details: `manifestId=${manifest.id} url=${manifest.url}${code != null ? ` code=${code}` : ""}`,
          });
        }
        tracking.platformLoadFail(manifest);
      },
      [manifest, tracking],
    );

    const onOpenWindow = useCallback(
      (event: WebViewOpenWindowEvent) => {
        openWindowExternally(event.nativeEvent.targetUrl, !!manifestDomainCheckEnabled);
      },
      [manifestDomainCheckEnabled],
    );

    useEffect(() => {
      tracking.platformLoad(manifest);
    }, [manifest, tracking]);

    const internalAppIds = useInternalAppIds() || INTERNAL_APP_IDS;

    const javaScriptCanOpenWindowsAutomatically = internalAppIds.includes(manifest.id);

    if (isBlockedByDomainCheck) {
      return <NetworkError handleTryAgain={() => {}} />;
    }

    return (
      <RNWebView
        ref={webviewRef}
        onScroll={onScroll}
        decelerationRate={Platform.OS === "ios" ? "normal" : 0.998}
        allowsBackForwardNavigationGestures
        startInLoadingState={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        renderLoading={renderLoading}
        originWhitelist={
          manifestDomainCheckEnabled ? MANIFEST_DOMAIN_CHECK_ORIGIN_WHITELIST : manifest.domains
        }
        allowedMainFrameOrigins={manifestDomainCheckEnabled ? (manifest.domains ?? []) : undefined}
        onShouldStartLoadWithRequest={
          manifestDomainCheckEnabled ? onShouldStartLoadWithRequest : undefined
        }
        allowsInlineMediaPlayback
        onMessage={handleMessage}
        messagingAllowedOrigins={messagingAllowedOrigins}
        onError={handleError}
        onOpenWindow={onOpenWindow}
        overScrollMode="content"
        bounces={false}
        mediaPlaybackRequiresUserAction={false}
        automaticallyAdjustContentInsets={false}
        scrollEnabled={true}
        style={styles.webview}
        javaScriptCanOpenWindowsAutomatically={javaScriptCanOpenWindowsAutomatically}
        webviewDebuggingEnabled={__DEV__}
        applicationNameForUserAgent={APPLICATION_NAME}
        injectedJavaScriptBeforeContentLoaded={
          Config.DETOX ? E2E_WEBVIEW_NETWORK_CAPTURE_SCRIPT : undefined
        }
        {...webviewProps}
      />
    );
  },
);

PlatformAPIWebview.displayName = "PlatformAPIWebview";

const styles = StyleSheet.create({
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
  },
  webview: {
    flex: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
});
