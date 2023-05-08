import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  RefObject,
  forwardRef,
} from "react";

import { useSelector } from "react-redux";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import VersionNumber from "react-native-version-number";
import { WebView as RNWebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { Operation, SignedOperation } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  safeGetRefValue,
  ExchangeType,
  UiHook,
  useConfig,
  useWalletAPIServer,
} from "@ledgerhq/live-common/wallet-api/react";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/tracking";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import BigNumber from "bignumber.js";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { NavigatorName, ScreenName } from "../../const";
import { flattenAccountsSelector } from "../../reducers/accounts";
import { track } from "../../analytics/segment";
import prepareSignTransaction from "./liveSDKLogic";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { analyticsEnabledSelector } from "../../reducers/settings";
import getOrCreateUser from "../../user";
import { WebviewAPI, WebviewProps } from "./types";
import { useWebviewState } from "./helpers";
import deviceStorage from "../../logic/storeWrapper";

const wallet = {
  name: "ledger-live-mobile",
  version: VersionNumber.appVersion,
};
const tracking = trackingWrapper(track);

function useUiHook(): Partial<UiHook> {
  const navigation = useNavigation();
  const [device, setDevice] = useState<Device>();

  return useMemo(
    () => ({
      "account.request": ({ accounts$, currencies, onSuccess, onError }) => {
        if (currencies.length === 1) {
          navigation.navigate(NavigatorName.RequestAccount, {
            screen: ScreenName.RequestAccountsSelectAccount,
            params: {
              accounts$,
              currency: currencies[0],
              allowAddAccount: true,
              onSuccess,
              onError,
            },
          });
        } else {
          navigation.navigate(NavigatorName.RequestAccount, {
            screen: ScreenName.RequestAccountsSelectCrypto,
            params: {
              accounts$,
              currencies,
              allowAddAccount: true,
              onSuccess,
              onError,
            },
          });
        }
      },
      "account.receive": ({
        account,
        parentAccount,
        accountAddress,
        onSuccess,
        onCancel,
        onError,
      }) => {
        navigation.navigate(ScreenName.VerifyAccount, {
          account,
          parentId: parentAccount ? parentAccount.id : undefined,
          onSuccess: () => onSuccess(accountAddress),
          onClose: onCancel,
          onError,
        });
      },
      "message.sign": ({ account, message, onSuccess, onError, onCancel }) => {
        navigation.navigate(NavigatorName.SignMessage, {
          screen: ScreenName.SignSummary,
          params: {
            message,
            accountId: account.id,
            onConfirmationHandler: onSuccess,
            onFailHandler: onError,
          },
          onClose: onCancel,
        });
      },
      "storage.get": async ({ key, storeId }) => {
        return (await deviceStorage.get(`${storeId}-${key}`)) as string;
      },
      "storage.set": ({ key, value, storeId }) => {
        deviceStorage.save(`${storeId}-${key}`, value);
      },
      "transaction.sign": ({
        account,
        parentAccount,
        signFlowInfos: { liveTx },
        options,
        onSuccess,
        onError,
      }) => {
        const tx = prepareSignTransaction(
          account,
          parentAccount,
          liveTx as Partial<Transaction & { gasLimit: BigNumber }>,
        );

        navigation.navigate(NavigatorName.SignTransaction, {
          screen: ScreenName.SignTransactionSummary,
          params: {
            currentNavigation: ScreenName.SignTransactionSummary,
            nextNavigation: ScreenName.SignTransactionSelectDevice,
            transaction: tx as Transaction,
            accountId: account.id,
            parentId: parentAccount ? parentAccount.id : undefined,
            appName: options?.hwAppId,
            onSuccess: ({
              signedOperation,
              transactionSignError,
            }: {
              signedOperation: SignedOperation;
              transactionSignError: Error;
            }) => {
              if (transactionSignError) {
                onError(transactionSignError);
              } else {
                onSuccess(signedOperation);

                const n =
                  navigation.getParent<
                    StackNavigatorNavigation<BaseNavigatorStackParamList>
                  >() || navigation;
                n.pop();
              }
            },
            onError,
          },
        });
      },
      "device.transport": ({ appName, onSuccess, onCancel }) => {
        navigation.navigate(ScreenName.DeviceConnect, {
          appName,
          onSuccess,
          onClose: onCancel,
        });
      },
      "exchange.start": ({ exchangeType, onSuccess, onCancel }) => {
        navigation.navigate(NavigatorName.PlatformExchange, {
          screen: ScreenName.PlatformStartExchange,
          params: {
            request: {
              exchangeType: ExchangeType[exchangeType],
            },
            onResult: (result: {
              startExchangeResult?: string;
              startExchangeError?: Error;
              device?: Device;
            }) => {
              if (result.startExchangeError) {
                onCancel(result.startExchangeError);
              }

              if (result.startExchangeResult) {
                setDevice(result.device);
                onSuccess(result.startExchangeResult);
              }

              const n =
                navigation.getParent<
                  StackNavigatorNavigation<BaseNavigatorStackParamList>
                >() || navigation;
              n.pop();
            },
          },
        });
      },
      "exchange.complete": ({ exchangeParams, onSuccess, onCancel }) => {
        navigation.navigate(NavigatorName.PlatformExchange, {
          screen: ScreenName.PlatformCompleteExchange,
          params: {
            request: {
              exchangeType: exchangeParams.exchangeType,
              provider: exchangeParams.provider,
              exchange: exchangeParams.exchange,
              transaction: exchangeParams.transaction as Transaction,
              binaryPayload: exchangeParams.binaryPayload,
              signature: exchangeParams.signature,
              feesStrategy: exchangeParams.feesStrategy,
            },
            device,
            onResult: (result: { operation?: Operation; error?: Error }) => {
              if (result.error) {
                onCancel(result.error);
              }
              if (result.operation) {
                onSuccess(result.operation.id);
              }
              setDevice(undefined);
              const n =
                navigation.getParent<
                  StackNavigatorNavigation<BaseNavigatorStackParamList>
                >() || navigation;
              n.pop();
            },
          },
        });
      },
    }),
    [navigation, device],
  );
}

const useGetUserId = () => {
  const [userId, setUserId] = useState("");

  useEffect(() => {
    let mounted = true;
    getOrCreateUser().then(({ user }) => {
      if (mounted) setUserId(user.id);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return userId;
};

function useWebView(
  { manifest }: Pick<WebviewProps, "manifest" | "inputs">,
  webviewRef: RefObject<RNWebView>,
) {
  const accounts = useSelector(flattenAccountsSelector);

  const uiHook = useUiHook();
  const analyticsEnabled = useSelector(analyticsEnabledSelector);
  const userId = useGetUserId();
  const config = useConfig({
    appId: manifest.id,
    userId,
    tracking: analyticsEnabled,
    wallet,
  });

  const webviewHook = useMemo(() => {
    return {
      reload: () => {
        const webview = safeGetRefValue(webviewRef);

        webview.reload();
      },
      // TODO: wallet-api-server lifecycle is not perfect and will try to send messages before a ref is available. Some additional thinkering is needed here.
      postMessage: (message: string) => {
        try {
          const webview = safeGetRefValue(webviewRef);

          webview.postMessage(message);
        } catch (error) {
          console.warn(
            "wallet-api-server tried to send a message while the webview was not yet initialized.",
          );
        }
      },
    };
  }, [webviewRef]);

  const { onMessage: onMessageRaw, onLoadError } = useWalletAPIServer({
    manifest: manifest as AppManifest,
    accounts,
    tracking,
    config,
    webviewHook,
    uiHook,
  });

  const onMessage = useCallback(
    e => {
      if (e.nativeEvent?.data) {
        onMessageRaw(e.nativeEvent.data);
      }
    },
    [onMessageRaw],
  );

  return {
    onLoadError,
    onMessage,
  };
}

function renderLoading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="small" />
    </View>
  );
}

export const WalletAPIWebview = forwardRef<WebviewAPI, WebviewProps>(
  (
    {
      manifest,
      inputs = {},
      onStateChange,
      allowsBackForwardNavigationGestures = true,
    },
    ref,
  ) => {
    const { webviewProps, webviewState, webviewRef } = useWebviewState(
      {
        manifest: manifest as AppManifest,
        inputs,
      },
      ref,
    );

    useEffect(() => {
      if (onStateChange) {
        onStateChange(webviewState);
      }
    }, [webviewState, onStateChange]);

    const { onMessage, onLoadError } = useWebView(
      {
        manifest,
        inputs,
      },
      webviewRef,
    );

    return (
      <RNWebView
        ref={webviewRef}
        startInLoadingState={true}
        showsHorizontalScrollIndicator={false}
        allowsBackForwardNavigationGestures={
          allowsBackForwardNavigationGestures
        }
        showsVerticalScrollIndicator={false}
        renderLoading={renderLoading}
        originWhitelist={manifest.domains}
        allowsInlineMediaPlayback
        onMessage={onMessage}
        onError={onLoadError}
        overScrollMode="content"
        bounces={false}
        mediaPlaybackRequiresUserAction={false}
        automaticallyAdjustContentInsets={false}
        scrollEnabled={true}
        style={styles.webview}
        {...webviewProps}
      />
    );
  },
);

WalletAPIWebview.displayName = "WalletAPIWebview";

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
