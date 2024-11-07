import { AppManifest, WalletAPIServer } from "@ledgerhq/live-common/wallet-api/types";
import { getClientHeaders, getInitialURL } from "@ledgerhq/live-common/wallet-api/helpers";
import {
  safeGetRefValue,
  ExchangeType,
  UiHook,
  useConfig,
  useWalletAPIServer,
  CurrentAccountHistDB,
  useManifestCurrencies,
  useCacheBustedLiveApps,
} from "@ledgerhq/live-common/wallet-api/react";
import { useDappCurrentAccount, useDappLogic } from "@ledgerhq/live-common/wallet-api/useDappLogic";
import type { Operation } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/tracking";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useSelector } from "react-redux";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { WebViewProps, WebView, WebViewMessageEvent } from "react-native-webview";
import VersionNumber from "react-native-version-number";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { flattenAccountsSelector } from "../../reducers/accounts";
import { WebviewAPI, WebviewProps, WebviewState } from "./types";
import prepareSignTransaction from "./liveSDKLogic";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { trackingEnabledSelector } from "../../reducers/settings";
import deviceStorage from "../../logic/storeWrapper";
import { track } from "../../analytics";
import getOrCreateUser from "../../user";
import * as bridge from "../../../e2e/bridge/client";
import Config from "react-native-config";
import { currentRouteNameRef } from "../../analytics/screenRefs";
import { walletSelector } from "~/reducers/wallet";
import { CacheMode, WebViewOpenWindowEvent } from "react-native-webview/lib/WebViewTypes";
import { Linking } from "react-native";
import { useCacheBustedLiveAppsDB } from "~/screens/Platform/v2/hooks";

export function useWebView(
  {
    manifest,
    currentAccountHistDb,
    inputs,
    customHandlers,
  }: Pick<WebviewProps, "manifest" | "inputs" | "customHandlers" | "currentAccountHistDb">,
  ref: React.ForwardedRef<WebviewAPI>,
  onStateChange: WebviewProps["onStateChange"],
) {
  const serverRef = useRef<WalletAPIServer>();

  const tracking = useMemo(
    () =>
      trackingWrapper((eventName: string, properties?: Record<string, unknown> | null) =>
        track(eventName, {
          ...properties,
          flowInitiatedFrom:
            currentRouteNameRef.current === "Platform Catalog"
              ? "Discover"
              : currentRouteNameRef.current,
        }),
      ),
    [],
  );

  const { webviewProps, webviewRef } = useWebviewState(
    {
      manifest: manifest as AppManifest,
      inputs,
    },
    ref,
    onStateChange,
    serverRef,
  );

  const accounts = useSelector(flattenAccountsSelector);

  const uiHook = useUiHook();
  const trackingEnabled = useSelector(trackingEnabledSelector);
  const userId = useGetUserId();
  const config = useConfig({
    appId: manifest.id,
    userId,
    tracking: trackingEnabled,
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
            message,
          );
        }
      },
    };
  }, [webviewRef]);

  const walletState = useSelector(walletSelector);

  const {
    onMessage: onMessageRaw,
    onLoadError,
    server,
  } = useWalletAPIServer({
    walletState,
    manifest: manifest as AppManifest,
    accounts,
    tracking,
    config,
    webviewHook,
    uiHook,
    customHandlers,
  });
  const [cacheBustedLiveAppsDb, setCacheBustedLiveAppsDbState] = useCacheBustedLiveAppsDB();
  const { edit, getLatest } = useCacheBustedLiveApps([
    cacheBustedLiveAppsDb,
    setCacheBustedLiveAppsDbState,
  ]);

  useEffect(() => {
    serverRef.current = server;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server]);

  const { onDappMessage, noAccounts } = useDappLogic({
    manifest,
    currentAccountHistDb,
    accounts,
    uiHook,
    postMessage: webviewHook.postMessage,
    tracking,
  });

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      if (e.nativeEvent?.data) {
        try {
          const msg = JSON.parse(e.nativeEvent.data);

          if (Config.MOCK && msg.type === "e2eTest") {
            bridge.sendWalletAPIResponse(msg.payload);
          } else if (msg.type === "dapp") {
            onDappMessage(msg);
          } else {
            onMessageRaw(e.nativeEvent.data);
          }
        } catch {
          onMessageRaw(e.nativeEvent.data);
        }
      }
    },
    [onDappMessage, onMessageRaw],
  );

  const onOpenWindow = useCallback((event: WebViewOpenWindowEvent) => {
    const { targetUrl } = event.nativeEvent;
    // Don't use canOpenURL as we cannot check unknown apps on the phone
    // Without listing everything in plist and android manifest
    Linking.openURL(targetUrl);
  }, []);

  useEffect(() => {
    const latestCacheBustedId = getLatest(manifest.id);
    const init = getLatest("init");
    // checking for init, which is set in INITIAL_PLATFORM_STATE
    // makes sure we're not just getting the default value, undefined
    if (
      webviewRef.current &&
      init &&
      manifest.cacheBustingId !== undefined &&
      manifest.cacheBustingId > (latestCacheBustedId || 0)
    ) {
      if (webviewRef.current.clearCache) {
        // save the latest cacheBustedId to the DiscoverDB
        // to avoid clearingCache everytime this liveApp is loaded
        edit(manifest.id, manifest.cacheBustingId);
        webviewRef.current.clearCache(true);
        webviewRef.current.reload();
      }
    }
  }, [manifest.id, manifest.cacheBustingId, webviewRef, getLatest, edit]);

  const webviewCacheOptions = useMemo(() => {
    if (manifest.nocache) {
      return {
        cacheEnabled: false,
        cacheMode: "LOAD_NO_CACHE" as CacheMode,
        incognito: true,
      };
    } else {
      return {};
    }
  }, [manifest.nocache]);

  return {
    onLoadError,
    onMessage,
    onOpenWindow,
    webviewCacheOptions,
    webviewProps,
    webviewRef,
    noAccounts,
  };
}

export const initialWebviewState: WebviewState = {
  url: "",
  canGoBack: false,
  canGoForward: false,
  title: "",
  loading: false,
};

export function useWebviewState(
  params: Pick<WebviewProps, "manifest" | "inputs">,
  WebviewAPIRef: React.ForwardedRef<WebviewAPI>,
  onStateChange: WebviewProps["onStateChange"],
  serverRef?: React.MutableRefObject<WalletAPIServer | undefined>,
) {
  const webviewRef = useRef<WebView>(null);
  const { manifest, inputs } = params;
  const initialURL = useMemo(() => getInitialURL(inputs, manifest), [manifest, inputs]);
  const [state, setState] = useState<WebviewState>(initialWebviewState);

  useEffect(() => {
    setURI(initialURL);
  }, [initialURL]);

  const [currentURI, setURI] = useState(initialURL);
  const { theme } = useTheme();

  const source = useMemo(
    () => {
      const headers = getClientHeaders({
        client: "ledger-live-mobile",
        theme,
      });
      if (manifest.nocache !== undefined) {
        headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        headers["Pragma"] = "no-cache";
        headers["Expires"] = "0";
      }
      return {
        uri: currentURI,
        headers,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentURI, manifest.id, manifest.nocache],
  );

  useImperativeHandle(
    WebviewAPIRef,
    () => {
      return {
        reload: () => {
          const webview = safeGetRefValue(webviewRef);
          webview.reload();
        },
        goBack: () => {
          const webview = safeGetRefValue(webviewRef);

          webview.goBack();
        },
        goForward: () => {
          const webview = safeGetRefValue(webviewRef);

          webview.goForward();
        },
        loadURL: (url: string): void => {
          setURI(url);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        notify: (method: `event.${string}`, params: any) => {
          serverRef?.current?.sendMessage(method, params);
        },
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onLoad: Required<WebViewProps>["onLoad"] = useCallback(({ nativeEvent }) => {
    setState({
      title: nativeEvent.title,
      url: nativeEvent.url,
      canGoBack: nativeEvent.canGoBack,
      canGoForward: nativeEvent.canGoForward,
      loading: nativeEvent.loading,
    });
  }, []);

  const onLoadStart: Required<WebViewProps>["onLoadStart"] = useCallback(({ nativeEvent }) => {
    setState({
      title: nativeEvent.title,
      url: nativeEvent.url,
      canGoBack: nativeEvent.canGoBack,
      canGoForward: nativeEvent.canGoForward,
      loading: nativeEvent.loading,
    });
  }, []);

  const onLoadEnd: Required<WebViewProps>["onLoadEnd"] = useCallback(({ nativeEvent }) => {
    setState({
      title: nativeEvent.title,
      url: nativeEvent.url,
      canGoBack: nativeEvent.canGoBack,
      canGoForward: nativeEvent.canGoForward,
      loading: nativeEvent.loading,
    });
  }, []);

  const onNavigationStateChange: Required<WebViewProps>["onNavigationStateChange"] = useCallback(
    event => {
      setState({
        title: event.title,
        url: event.url,
        canGoBack: event.canGoBack,
        canGoForward: event.canGoForward,
        loading: event.loading,
      });
    },
    [],
  );

  useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  const props: Partial<WebViewProps> = useMemo(
    () => ({
      onLoad,
      onLoadStart,
      onLoadEnd,
      onNavigationStateChange,
      source,
    }),
    [onLoad, onLoadEnd, onLoadStart, onNavigationStateChange, source],
  );

  return {
    webviewProps: props,
    webviewRef,
  };
}

function useUiHook(): UiHook {
  const navigation = useNavigation();
  const [device, setDevice] = useState<Device>();

  return useMemo(
    () => ({
      "account.request": ({ accounts$, currencies, onSuccess, onCancel }) => {
        if (currencies.length === 1) {
          navigation.navigate(NavigatorName.RequestAccount, {
            screen: ScreenName.RequestAccountsSelectAccount,
            params: {
              accounts$,
              currency: currencies[0],
              allowAddAccount: true,
              onSuccess,
            },
            onClose: onCancel,
          });
        } else {
          navigation.navigate(NavigatorName.RequestAccount, {
            screen: ScreenName.RequestAccountsSelectCrypto,
            params: {
              accounts$,
              currencies,
              allowAddAccount: true,
              onSuccess,
            },
            onClose: onCancel,
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
        const tx = prepareSignTransaction(account, parentAccount, liveTx);

        navigation.navigate(NavigatorName.SignTransaction, {
          screen: ScreenName.SignTransactionSummary,
          params: {
            currentNavigation: ScreenName.SignTransactionSummary,
            nextNavigation: ScreenName.SignTransactionSelectDevice,
            transaction: tx,
            accountId: account.id,
            parentId: parentAccount ? parentAccount.id : undefined,
            appName: options?.hwAppId,
            dependencies: options?.dependencies,
            onSuccess,
            onError,
          },
          onError,
        });
      },
      "transaction.broadcast": () => {},
      "device.transport": ({ appName, onSuccess, onCancel }) => {
        navigation.navigate(ScreenName.DeviceConnect, {
          appName,
          onSuccess,
          onClose: onCancel,
        });
      },
      "device.select": ({ appName, onSuccess, onCancel }) => {
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
            onResult: result => {
              if (result.startExchangeError) {
                onCancel(result.startExchangeError.error);
              }

              if (result.startExchangeResult) {
                setDevice(result.device);
                onSuccess(result.startExchangeResult.nonce);
              }

              const n =
                navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>() ||
                navigation;
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
                navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>() ||
                navigation;
              n.pop();
            },
          },
        });
      },
    }),
    [navigation, device],
  );
}

const wallet = {
  name: "ledger-live-mobile",
  version: VersionNumber.appVersion,
};

function useGetUserId() {
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

export function useSelectAccount({
  manifest,
  currentAccountHistDb,
}: {
  manifest: AppManifest;
  currentAccountHistDb?: CurrentAccountHistDB;
}) {
  const currencies = useManifestCurrencies(manifest);
  const { setCurrentAccountHist, currentAccount } = useDappCurrentAccount(currentAccountHistDb);
  const navigation = useNavigation();

  const onSelectAccount = useCallback(() => {
    if (currencies.length === 1) {
      navigation.navigate(NavigatorName.RequestAccount, {
        screen: ScreenName.RequestAccountsSelectAccount,
        params: {
          currency: currencies[0],
          allowAddAccount: true,
          onSuccess: account => {
            setCurrentAccountHist(manifest.id, account);
          },
        },
      });
    } else {
      navigation.navigate(NavigatorName.RequestAccount, {
        screen: ScreenName.RequestAccountsSelectCrypto,
        params: {
          currencies,
          allowAddAccount: true,
          onSuccess: account => {
            setCurrentAccountHist(manifest.id, account);
          },
        },
      });
    }
  }, [manifest.id, currencies, navigation, setCurrentAccountHist]);

  return { onSelectAccount, currentAccount };
}
