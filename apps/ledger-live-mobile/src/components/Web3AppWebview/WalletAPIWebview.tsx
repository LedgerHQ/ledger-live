import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  RefObject,
} from "react";
import { useSelector } from "react-redux";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import VersionNumber from "react-native-version-number";
import { WebView as RNWebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { SignedOperation } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  UiHook,
  useConfig,
  useWalletAPIServer,
  useWalletAPIUrl,
} from "@ledgerhq/live-common/wallet-api/react";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/tracking";
import BigNumber from "bignumber.js";
import { NavigatorName, ScreenName } from "../../const";
import { flattenAccountsSelector } from "../../reducers/accounts";
import { track } from "../../analytics/segment";
import prepareSignTransaction from "./liveSDKLogic";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { analyticsEnabledSelector } from "../../reducers/settings";
import getOrCreateUser from "../../user";
import { WebviewProps } from "./types";
import { useWebviewState } from "./helpers";

const wallet = {
  name: "ledger-live-mobile",
  version: VersionNumber.appVersion,
};
const tracking = trackingWrapper(track);

function useUiHook(): Partial<UiHook> {
  const navigation = useNavigation();

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
    }),
    [navigation],
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
  { manifest, inputs }: Pick<WebviewProps, "manifest" | "inputs">,
  webviewRef: RefObject<RNWebView>,
) {
  const accounts = useSelector(flattenAccountsSelector);

  const uiHook = useUiHook();
  const url = useWalletAPIUrl(manifest, inputs);
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
      reload: () => webviewRef.current?.reload(),
      postMessage: (message: string) => {
        webviewRef.current?.postMessage(message);
      },
    };
  }, []);

  const { onMessage: onMessageRaw, onLoadError } = useWalletAPIServer({
    manifest,
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
    uri: url.toString(),
    webviewRef,
    onLoadError,
    onMessage,
  };
}

function renderLoading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export function WalletAPIWebview({
  manifest,
  inputs = {},
  renderTopBar,
}: WebviewProps) {
  const webviewRef = React.useRef<RNWebView>(null);
  const { webviewProps, webviewState } = useWebviewState();

  const { uri, onMessage, onLoadError } = useWebView(
    {
      manifest,
      inputs,
    },
    webviewRef,
  );

  const source = useMemo(() => {
    return {
      uri,
    };
  }, [uri]);

  const navigation =
    useNavigation<
      RootNavigationComposite<
        StackNavigatorNavigation<BaseNavigatorStackParamList>
      >
    >();

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) {
      return;
    }

    navigation.setOptions({
      headerRight: renderTopBar
        ? () => renderTopBar(manifest, webviewRef, webviewState)
        : undefined,
      headerShown: !!renderTopBar,
    });
  }, [manifest, navigation, renderTopBar, webviewState]);

  return (
    <RNWebView
      ref={webviewRef}
      startInLoadingState={true}
      showsHorizontalScrollIndicator={false}
      allowsBackForwardNavigationGestures
      showsVerticalScrollIndicator={false}
      renderLoading={renderLoading}
      originWhitelist={manifest.domains}
      allowsInlineMediaPlayback
      source={source}
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
}

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
  },
});
