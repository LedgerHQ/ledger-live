import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import VersionNumber from "react-native-version-number";
import { WebView as RNWebView } from "react-native-webview";
import BigNumber from "bignumber.js";
import { WebViewNativeEvent } from "react-native-webview/lib/WebViewTypes";
import { useTheme } from "styled-components/native";
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
import { Flex, Icon } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "../../const";
import { flattenAccountsSelector } from "../../reducers/accounts";
import prepareSignTransaction from "./liveSDKLogic";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { analyticsEnabledSelector } from "../../reducers/settings";
import getOrCreateUser from "../../user";
import { track } from "../../analytics/segment";
import { RootProps } from "./types";
import HeaderTitle from "../HeaderTitle";

const wallet = {
  name: "ledger-live-mobile",
  version: VersionNumber.appVersion,
};
const tracking = trackingWrapper(track);

export function useUiHook(): Partial<UiHook> {
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

export function useGetUserId() {
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
}

export function useBrowserNavigator() {
  const { colors } = useTheme();
  const [navState, setNavState] = useState<
    Pick<WebViewNativeEvent, "canGoBack" | "canGoForward">
  >({
    canGoBack: false,
    canGoForward: false,
  });

  const onNavStateChange = useCallback((newNavState: WebViewNativeEvent) => {
    const { canGoBack, canGoForward } = newNavState;
    setNavState({
      canGoBack,
      canGoForward,
    });
  }, []);

  const navColors = useMemo(
    () => ({
      goBack: navState.canGoBack ? colors.neutral.c100 : colors.neutral.c50,
      goForward: navState.canGoForward
        ? colors.neutral.c100
        : colors.neutral.c50,
    }),
    [navState, colors],
  );

  return { onNavStateChange, navColors, navState };
}

export function useWebView({
  manifest,
  inputs,
  hideHeader,
}: Pick<RootProps, "manifest" | "inputs" | "hideHeader">) {
  const accounts = useSelector(flattenAccountsSelector);
  const navigation = useNavigation();
  const [loadDate, setLoadDate] = useState(new Date());
  const [isInfoPanelOpened, setIsInfoPanelOpened] = useState(false);
  const { onNavStateChange, navColors, navState } = useBrowserNavigator();

  const webviewRef = useRef<RNWebView>(null);
  const uiHook = useUiHook();
  const url = useWalletAPIUrl(
    manifest,
    {
      loadDate,
    },
    inputs,
  );
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

  const {
    onLoad,
    onReload: onReloadRaw,
    onMessage: onMessageRaw,
    onLoadError,
  } = useWalletAPIServer({
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

  const onReload = useCallback(() => {
    onReloadRaw();
    setLoadDate(new Date()); // TODO: wtf
  }, [onReloadRaw, setLoadDate]);

  const onPressInfo = useCallback(() => {
    setIsInfoPanelOpened(true);
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerTitleAlign: "left",
      headerLeft: () => null,
      headerTitleContainerStyle: { marginHorizontal: 0 },
      headerTitle: () => (
        <Flex justifyContent={"center"} flex={1}>
          <HeaderTitle color="neutral.c70"> {manifest.homepageUrl}</HeaderTitle>
        </Flex>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onPressInfo}>
            <Flex
              alignItems="center"
              justifyContent="center"
              height={40}
              width={40}
            >
              <Icon name="Info" color="neutral.c70" size={20} />
            </Flex>
          </TouchableOpacity>
          <TouchableOpacity onPress={navigation.goBack}>
            <Flex
              alignItems="center"
              justifyContent="center"
              height={40}
              width={40}
            >
              <Icon name="Close" color="neutral.c100" size={20} />
            </Flex>
          </TouchableOpacity>
        </View>
      ),
      headerShown: !hideHeader,
    });
  }, [manifest.homepageUrl, navigation, onPressInfo, hideHeader]);

  return {
    uri: url.toString(),
    isInfoPanelOpened,
    setIsInfoPanelOpened,
    webviewRef,
    onLoad,
    onLoadError,
    onMessage,
    onNavStateChange,
    onReload,
    navColors,
    navState,
  };
}

const styles = StyleSheet.create({
  headerRight: {
    display: "flex",
    flexDirection: "row",
    paddingRight: 8,
  },
  buttons: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
});
