import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  BackHandler,
  Platform,
  View,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";

import { Flex, Icon, Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { INTERNAL_APP_IDS } from "@ledgerhq/live-common/wallet-api/constants";
import { useInternalAppIds } from "@ledgerhq/live-common/hooks/useInternalAppIds";
import { safeUrl } from "@ledgerhq/live-common/wallet-api/helpers";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "styled-components/native";

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

type BackToInternalDomainProps = {
  manifest: AppManifest;
  webviewURL?: string;
  lastMatchingURL?: string | null;
  config: {
    screen: ScreenName.ExchangeBuy | ScreenName.ExchangeSell | ScreenName.Card;
    navigator: NavigatorName.Exchange | NavigatorName.Card;
    btnText: string;
  };
};

function BackToInternalDomain({
  manifest,
  webviewURL,
  lastMatchingURL,
  config,
}: BackToInternalDomainProps) {
  const { t } = useTranslation();
  const { screen, navigator, btnText } = config;
  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  const internalAppIds = useInternalAppIds() || INTERNAL_APP_IDS;

  const handleBackClick = async () => {
    const manifestId = (await AsyncStorage.getItem("manifest-id")) || "";

    if (manifestId) {
      const lastScreen = (await AsyncStorage.getItem("last-screen")) || "";
      const flowName = (await AsyncStorage.getItem("flow-name")) || "";

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
    } else if (internalAppIds.includes(manifest.id) && lastMatchingURL && webviewURL) {
      const currentHostname = new URL(webviewURL).hostname;
      const url = new URL(lastMatchingURL);
      const urlParams = new URLSearchParams(url.searchParams);
      const flowName = urlParams.get("liveAppFlow")!;

      track("button_clicked", {
        button: flowName === "compare_providers" ? "back to quote" : "back to liveapp",
        provider: currentHostname,
        flow: flowName,
      });

      navigation.goBack();
    }
  };

  return (
    <View style={styles.headerLeft}>
      <TouchableOpacity onPress={handleBackClick}>
        <Flex alignItems="center" flexDirection="row" height={40}>
          <Icon name="ChevronLeft" color="neutral.c100" size={30} />
          <Text fontWeight="semiBold" fontSize={16} color="neutral.c100">
            {t("common.backTo", { to: btnText })}
          </Text>
        </Flex>
      </TouchableOpacity>
    </View>
  );
}

function HeaderRight({ onClose }: { onClose?: () => void }) {
  const { colors } = useTheme();

  return <NavigationHeaderCloseButtonAdvanced onClose={onClose} color={colors.neutral.c100} />;
}

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

            await AsyncStorage.multiSet([
              ["manifest-id", manifestId],
              ["flow-name", flowName],
              ["last-screen", lastScreen],
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

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (Platform.OS === "android") {
      BackHandler.addEventListener("hardwareBackPress", handleHardwareBackPress);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", handleHardwareBackPress);
      };
    }
  }, [handleHardwareBackPress]);

  const onClose = useCallback(() => {
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }, [navigation]);

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
        headerRight: () => <HeaderRight onClose={onClose} />,
        headerLeft: () =>
          isInternalApp ? null : (
            <BackToInternalDomain
              manifest={manifest}
              webviewURL={webviewState?.url}
              lastMatchingURL={lastMatchingURL?.current}
              config={config}
            />
          ),
        headerTitle: () => null,
      });
    }
  }, [config, disableHeader, isInternalApp, manifest, navigation, onClose, webviewState?.url]);

  const customHandlers = usePTXCustomHandlers(manifest);

  return (
    <SafeAreaView style={[styles.root]}>
      <Web3AppWebview
        ref={webviewAPIRef}
        manifest={manifest}
        inputs={inputs}
        onStateChange={setWebviewState}
        customHandlers={customHandlers}
      />
      {webviewState.loading ? <Loading /> : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
