import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  BackHandler,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import { ScopeProvider } from "jotai-scope";

import { useNavigation } from "@react-navigation/native";
import { Flex, Icon, Text } from "@ledgerhq/native-ui";
import { currentAccountAtom } from "@ledgerhq/live-common/wallet-api/useDappLogic";
import { WebviewAPI, WebviewState } from "../Web3AppWebview/types";

import { Web3AppWebview } from "../Web3AppWebview";
import { RootNavigationComposite, StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { initialWebviewState } from "../Web3AppWebview/helpers";

import { completeOnboarding, setHasOrderedNano, setReadOnlyMode } from "~/actions/settings";
import { NavigationHeaderCloseButtonAdvanced } from "../NavigationHeaderCloseButton";
import { NavigatorName, ScreenName } from "~/const";
import { useTranslation } from "react-i18next";

type Props = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string | undefined>;
};

const WebRecievePlayer = ({ manifest, inputs }: Props) => {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const dispatch = useDispatch();

  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  const handleHardwareBackPress = useCallback(() => {
    return true; // prevent default behavior (native navigation)
  }, []);

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
    navigation.setOptions({
      headerRight: () => <HeaderRight />,
      headerLeft: () => <BackToInternalDomain />,
      headerTitle: () => null,
      headerShown: true,
    });
  }, [manifest, navigation, webviewState]);

  const handleBypassOnboarding = useCallback(() => {
    dispatch(completeOnboarding());
    dispatch(setReadOnlyMode(false));
    dispatch(setHasOrderedNano(false));
  }, [dispatch]);

  useEffect(() => {
    if (!webviewState?.url) return;

    const url = new URL(webviewState.url);
    const paramBypassOnboarding = url.searchParams.get("bypassLLOnboarding");

    if (paramBypassOnboarding === "true") handleBypassOnboarding();
  }, [handleBypassOnboarding, webviewState]);

  console.log(">> manifest", manifest);

  return (
    <ScopeProvider atoms={[currentAccountAtom]}>
      <SafeAreaView style={[styles.root, { paddingTop: 0 }]}>
        <Web3AppWebview
          ref={webviewAPIRef}
          manifest={manifest}
          inputs={inputs}
          onStateChange={setWebviewState}
          allowsBackForwardNavigationGestures={false}
        />
      </SafeAreaView>
    </ScopeProvider>
  );
};

export default WebRecievePlayer;

function BackToInternalDomain() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  const handleBackClick = async () => {
    // TODO: tracking
    //   track("button_clicked", {
    //     button: "back to liveapp",
    //     provider: manifestId,
    //     flow: flowName,
    //   });

    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveTypeMenu,
    });
  };

  return (
    <View style={styles.headerLeft}>
      <TouchableOpacity onPress={handleBackClick}>
        <Flex alignItems="center" flexDirection="row" height={40}>
          <Icon name="ChevronLeft" color="neutral.c100" size={30} />
          <Text fontWeight="semiBold" fontSize={16} color="neutral.c100">
            {t("common.backTo")}
          </Text>
        </Flex>
      </TouchableOpacity>
    </View>
  );
}

function HeaderRight() {
  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  const onClose = useCallback(() => {
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }, [navigation]);

  return (
    <NavigationHeaderCloseButtonAdvanced
      color="neutral.c100"
      onClose={onClose}
      skipNavigation={false}
    />
  );
}

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
