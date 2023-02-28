import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useSelector } from "react-redux";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import VersionNumber from "react-native-version-number";
import { WebView as RNWebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { SignedOperation } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import {
  UiHook,
  useConfig,
  useWalletAPIServer,
  useWalletAPIUrl,
} from "@ledgerhq/live-common/wallet-api/react";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/tracking";
import { useTheme } from "styled-components/native";
import BigNumber from "bignumber.js";
import { NavigatorName, ScreenName } from "../../const";
import { flattenAccountsSelector } from "../../reducers/accounts";
import UpdateIcon from "../../icons/Update";
import InfoIcon from "../../icons/Info";
import InfoPanel from "./InfoPanel";
import { track } from "../../analytics/segment";
import prepareSignTransaction from "./liveSDKLogic";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { analyticsEnabledSelector } from "../../reducers/settings";
import getOrCreateUser from "../../user";

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

function useWebView({ manifest, inputs }: Pick<Props, "manifest" | "inputs">) {
  const accounts = useSelector(flattenAccountsSelector);
  const navigation = useNavigation();
  const [loadDate, setLoadDate] = useState(new Date());
  const [isInfoPanelOpened, setIsInfoPanelOpened] = useState(false);

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
    widgetLoaded,
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

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <ReloadButton onReload={onReload} loading={!widgetLoaded} />
          <InfoPanelButton
            loading={!widgetLoaded}
            setIsInfoPanelOpened={setIsInfoPanelOpened}
          />
        </View>
      ),
    });
  }, [navigation, widgetLoaded, onReload, isInfoPanelOpened]);

  return {
    uri: url.toString(),
    isInfoPanelOpened,
    setIsInfoPanelOpened,
    webviewRef,
    onLoad,
    onLoadError,
    onMessage,
  };
}

function ReloadButton({
  onReload,
  loading,
}: {
  onReload: () => void;
  loading: boolean;
}) {
  const { colors } = useTheme();
  const onPress = useCallback(
    () => !loading && onReload(),
    [loading, onReload],
  );

  return (
    <TouchableOpacity
      style={styles.buttons}
      disabled={loading}
      onPress={onPress}
    >
      <UpdateIcon size={18} color={colors.neutral.c70} />
    </TouchableOpacity>
  );
}

function InfoPanelButton({
  loading,
  setIsInfoPanelOpened,
}: {
  loading: boolean;
  setIsInfoPanelOpened: (_: boolean) => void;
}) {
  const { colors } = useTheme();

  const onPress = useCallback(() => {
    setIsInfoPanelOpened(true);
  }, [setIsInfoPanelOpened]);

  return (
    <TouchableOpacity
      style={styles.buttons}
      disabled={loading}
      onPress={onPress}
    >
      <InfoIcon size={18} color={colors.neutral.c70} />
    </TouchableOpacity>
  );
}

function renderLoading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

interface Props {
  manifest: AppManifest;
  inputs?: Record<string, string>;
}

export function WebView({ manifest, inputs }: Props) {
  const {
    uri,
    isInfoPanelOpened,
    setIsInfoPanelOpened,
    webviewRef,
    onLoad,
    onMessage,
    onLoadError,
  } = useWebView({
    manifest,
    inputs,
  });

  const source = useMemo(() => {
    return {
      uri,
    };
  }, [uri]);

  return (
    <SafeAreaView style={styles.root}>
      <InfoPanel
        name={manifest.name}
        icon={manifest.icon}
        url={manifest.homepageUrl}
        uri={uri}
        description={manifest.content.description}
        isOpened={isInfoPanelOpened}
        setIsOpened={setIsInfoPanelOpened}
      />
      <RNWebView
        ref={webviewRef}
        startInLoadingState={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        renderLoading={renderLoading}
        originWhitelist={manifest.domains}
        allowsInlineMediaPlayback
        source={source}
        onLoad={onLoad}
        onMessage={onMessage}
        onError={onLoadError}
        overScrollMode="content"
        bounces={false}
        mediaPlaybackRequiresUserAction={false}
        automaticallyAdjustContentInsets={false}
        scrollEnabled={true}
        style={styles.webview}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerRight: {
    display: "flex",
    flexDirection: "row",
    paddingRight: 8,
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
  modalContainer: {
    flexDirection: "row",
  },
  webview: {
    flex: 0,
    width: "100%",
    height: "100%",
  },
  buttons: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
});
