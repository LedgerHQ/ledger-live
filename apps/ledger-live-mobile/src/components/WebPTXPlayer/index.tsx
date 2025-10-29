import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, BackHandler, Platform, View, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { Flex, Icon, Text } from "@ledgerhq/native-ui";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { INTERNAL_APP_IDS } from "@ledgerhq/live-common/wallet-api/constants";
import { useInternalAppIds } from "@ledgerhq/live-common/hooks/useInternalAppIds";
import { safeUrl } from "@ledgerhq/live-common/wallet-api/helpers";

import storage from "LLM/storage";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";

import { flattenAccountsSelector } from "~/reducers/accounts";
import { WebviewAPI, WebviewState } from "../Web3AppWebview/types";
import { Web3AppWebview } from "../Web3AppWebview";
import { RootNavigationComposite, StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import { track } from "~/analytics";
import { NavigationHeaderCloseButtonAdvanced } from "../NavigationHeaderCloseButton";
import { NavigatorName, ScreenName } from "~/const";
import { Loading } from "../Loading";
import { usePTXCustomHandlers } from "./CustomHandlers";
import { useDeeplinkCustomHandlers } from "../WebPlatformPlayer/CustomHandlers";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";

type BackToInternalDomainProps = {
  config: {
    screen: ScreenName.ExchangeBuy | ScreenName.ExchangeSell | ScreenName.Card;
    navigator: NavigatorName.Exchange | NavigatorName.Card;
    btnText: string;
  };
};

function BackToInternalDomain({ config }: BackToInternalDomainProps) {
  const { t } = useTranslation();
  const { screen, navigator, btnText } = config;
  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  const handleBackClick = async () => {
    const manifestId = (await storage.getString("manifest-id")) ?? "";

    if (manifestId) {
      const [lastScreen = "", flowName = ""] = await Promise.all([
        storage.getString("last-screen"),
        storage.getString("flow-name"),
      ]);

      track("button_clicked", {
        button: lastScreen === "compare_providers" ? "back to quote" : "back to liveapp",
        provider: manifestId,
        flow: flowName,
      });

      navigation.navigate(navigator, {
        screen,
        params: {
          referrer: "isExternal",
        },
      });
    } else {
      // We've lost our persisted state so go all the back home
      navigation.getParent()?.navigate(NavigatorName.Base, {
        screen: NavigatorName.Main,
      });
    }
  };

  const buttonLabel = useMemo(() => {
    return t("common.backTo", { to: btnText });
  }, [t, btnText]);

  return (
    <View style={styles.headerLeft}>
      <TouchableOpacity onPress={handleBackClick}>
        <Flex alignItems="center" flexDirection="row" height={40}>
          <Icon name="ChevronLeft" color="neutral.c100" size={30} />
          <Text fontWeight="semiBold" fontSize={16} color="neutral.c100">
            {buttonLabel}
          </Text>
        </Flex>
      </TouchableOpacity>
    </View>
  );
}

function HeaderRight({ softExit }: { softExit: boolean }) {
  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();
  const { colors } = useTheme();

  const onClose = useCallback(() => {
    softExit
      ? navigation.goBack()
      : navigation.navigate(NavigatorName.Base, {
          screen: NavigatorName.Main,
        });
  }, [navigation, softExit]);

  return (
    <NavigationHeaderCloseButtonAdvanced
      onClose={onClose}
      color={colors.neutral.c100}
      skipNavigation={softExit}
    />
  );
}

export type InterstitialType = React.ComponentType<{
  manifest: LiveAppManifest;
  isLoading: boolean;
  description?: string;
}>;

type Props = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string | undefined>;
  disableHeader?: boolean;
  config?:
    | {
        screen: ScreenName.ExchangeBuy | ScreenName.ExchangeSell;
        navigator: NavigatorName.Exchange;
        btnText: string;
      }
    | {
        screen: ScreenName.Card;
        navigator: NavigatorName.Card;
        btnText: string;
      };
  softExit?: boolean;
  Interstitial?: InterstitialType;
};

export const WebPTXPlayer = ({
  manifest,
  inputs,
  disableHeader,
  config = {
    screen: ScreenName.ExchangeSell,
    btnText: manifest.name,
    navigator: NavigatorName.Exchange,
  },
  softExit = false,
  Interstitial,
}: Props) => {
  const lastMatchingURL = useRef<string | null>(null);
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const internalAppIds = useInternalAppIds() || INTERNAL_APP_IDS;

  const isInternalApp = useMemo(() => {
    if (!internalAppIds.includes(manifest.id)) {
      return false;
    }

    if (!lastMatchingURL || !webviewState.url) {
      return true;
    }

    const manifestHostname = new URL(manifest.url).hostname;
    const currentHostname = new URL(webviewState.url).hostname;

    return manifestHostname === currentHostname;
  }, [internalAppIds, manifest.id, manifest.url, webviewState.url]);

  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  useEffect(() => {
    (async () => {
      if (isInternalApp && webviewState.url) {
        const url = safeUrl(webviewState.url);

        if (url) {
          const goToURL = url.searchParams.get("goToURL") || "";
          const manifestId = url.searchParams.get("goToManifest");

          if (manifestId && goToURL) {
            const searchParams = url.searchParams;
            const flowName = searchParams.get("flowName") || "";
            const lastScreen = searchParams.get("lastScreen") || flowName;

            await Promise.all([
              storage.saveString("manifest-id", manifestId),
              storage.saveString("flow-name", flowName),
              storage.saveString("last-screen", lastScreen),
            ]);

            navigation.navigate(config.navigator, {
              screen: config.screen,
              params: {
                platform: manifestId,
                goToURL,
              },
            });

            return void 0;
          }
        }
      }

      if (isInternalApp && lastMatchingURL) {
        lastMatchingURL.current = webviewState.url;
      }
    })();
  }, [config.navigator, config.screen, isInternalApp, navigation, webviewState.url]);

  const handleHardwareBackPress = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    if (webviewState.canGoBack) {
      webview.goBack();
      return true; // prevent default behavior (native navigation)
    }

    return false;
  }, [webviewState.canGoBack, webviewAPIRef]);

  useEffect(() => {
    if (Platform.OS === "android") {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleHardwareBackPress,
      );

      return () => {
        subscription.remove();
      };
    }
  }, [handleHardwareBackPress]);

  useEffect(() => {
    const handler = (e: { preventDefault: () => void }) => {
      const webviewAPI = safeGetRefValue(webviewAPIRef);
      if (webviewState.canGoBack) {
        webviewAPI.goBack();
        e.preventDefault();
      }
    };
    navigation.addListener("beforeRemove", handler);

    return () => {
      navigation.removeListener("beforeRemove", handler);
    };
  }, [webviewState.canGoBack, navigation]);

  useEffect(() => {
    if (!disableHeader) {
      navigation.setOptions({
        headerRight: () => (isInternalApp ? null : <HeaderRight softExit={softExit} />),
        headerLeft: () => (isInternalApp ? null : <BackToInternalDomain config={config} />),
        headerTitle: () => null,
        title: "",
        headerShown: !isInternalApp,
      });
    }
  }, [config, disableHeader, isInternalApp, manifest, navigation, webviewState?.url, softExit]);

  const accounts = useSelector(flattenAccountsSelector);
  const customPTXHandlers = usePTXCustomHandlers(manifest, accounts);
  const customDeeplinkHandlers = useDeeplinkCustomHandlers();
  const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...customPTXHandlers,
      ...customDeeplinkHandlers,
    };
  }, [customPTXHandlers, customDeeplinkHandlers]);
  return (
    <SafeAreaView edges={isInternalApp ? ["left", "right", "top"] : ["left", "right"]} isFlex>
      <Web3AppWebview
        ref={webviewAPIRef}
        manifest={manifest}
        inputs={inputs}
        onStateChange={setWebviewState}
        customHandlers={customHandlers}
        Loader={PTXLoader}
      />
      {Interstitial && <Interstitial manifest={manifest} isLoading={webviewState.loading} />}
    </SafeAreaView>
  );
};

const PTXLoader = () => {
  return <Loading />;
};

const styles = StyleSheet.create({
  headerLeft: {
    display: "flex",
    flexDirection: "row",
    paddingRight: 8,
  },
  buttons: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
});
