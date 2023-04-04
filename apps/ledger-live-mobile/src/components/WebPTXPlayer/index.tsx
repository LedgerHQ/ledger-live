import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  StyleSheet,
  SafeAreaView,
  BackHandler,
  Platform,
  View,
  TouchableOpacity,
} from "react-native";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";

import { useNavigation } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import { Flex, Icon, Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { useTranslation } from "react-i18next";
import { WebviewAPI, WebviewState } from "../Web3AppWebview/types";

import { Web3AppWebview } from "../Web3AppWebview";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import HeaderRightClose from "../HeaderRightClose";

type BackToWhitelistedDomainProps = {
  manifest: AppManifest;
};

function BackToWhitelistedDomain({ manifest }: BackToWhitelistedDomainProps) {
  const { t } = useTranslation();
  const navigation =
    useNavigation<
      RootNavigationComposite<
        StackNavigatorNavigation<BaseNavigatorStackParamList>
      >
    >();

  return (
    <View style={styles.headerLeft}>
      <TouchableOpacity onPress={navigation.goBack}>
        <Flex alignItems="center" flexDirection="row" height={40}>
          <Icon name="ChevronLeft" color="neutral.c100" size={30} />
          <Text fontWeight="semiBold" fontSize={16} color="neutral.c100">
            {t("common.backTo", { to: manifest.name })}
          </Text>
        </Flex>
      </TouchableOpacity>
    </View>
  );
}

function HeaderRight() {
  const { colors } = useTheme();

  return <HeaderRightClose color={colors.neutral.c100} />;
}

type Props = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string>;
};

export const WebPTXPlayer = ({ manifest, inputs }: Props) => {
  const lastMatchingURL = useRef<string | null>(null);

  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] =
    useState<WebviewState>(initialWebviewState);

  const isWhitelistedDomain = useMemo(() => {
    if (!lastMatchingURL || !webviewState.url) {
      return true;
    }

    const manifestHostname = new URL(manifest.url).hostname;
    const currentHostname = new URL(webviewState.url).hostname;

    return manifestHostname === currentHostname;
  }, [manifest.url, webviewState.url]);

  useEffect(() => {
    if (isWhitelistedDomain) {
      lastMatchingURL.current = webviewState.url;
    }
  }, [isWhitelistedDomain, webviewState.url]);

  const navigation =
    useNavigation<
      RootNavigationComposite<
        StackNavigatorNavigation<BaseNavigatorStackParamList>
      >
    >();

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
      BackHandler.addEventListener(
        "hardwareBackPress",
        handleHardwareBackPress,
      );

      return () => {
        BackHandler.removeEventListener(
          "hardwareBackPress",
          handleHardwareBackPress,
        );
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
    navigation.setOptions({
      headerRight: () => <HeaderRight />,
      headerLeft: () =>
        isWhitelistedDomain ? null : (
          <BackToWhitelistedDomain manifest={manifest} />
        ),
      headerTitle: () => null,
    });
  }, [manifest, navigation, webviewState, isWhitelistedDomain]);

  return (
    <SafeAreaView style={[styles.root]}>
      <Web3AppWebview
        ref={webviewAPIRef}
        manifest={manifest}
        inputs={inputs}
        onStateChange={setWebviewState}
      />
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
