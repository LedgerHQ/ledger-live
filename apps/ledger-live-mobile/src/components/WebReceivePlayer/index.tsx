import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, SafeAreaView, BackHandler, Platform } from "react-native";
import { ScopeProvider } from "jotai-scope";
import { useNavigation } from "@react-navigation/native";
import { currentAccountAtom } from "@ledgerhq/live-common/wallet-api/useDappLogic";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Web3AppWebview } from "../Web3AppWebview";
import { WebviewAPI, WebviewState } from "../Web3AppWebview/types";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import { RootNavigationComposite, StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { ProviderInterstitial } from "LLM/components/ProviderInterstitial";

type Props = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string | undefined>;
};

const WebReceivePlayer = ({ manifest, inputs }: Props) => {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const { t } = useTranslation();

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
      headerRight: () => null,
      headerLeft: () => null,
      headerTitle: "",
      headerShown: true,
    });
  }, [navigation]);

  const handleClose = useCallback(async () => {
    try {
      const parent = navigation.getParent();

      if (parent && "pop" in parent && typeof parent.pop === "function") {
        parent.pop();
      } else if ("closeDrawer" in navigation && typeof navigation.closeDrawer === "function") {
        navigation.closeDrawer();
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      }

      return;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[WebReceivePlayer] Error in close handler:", error);
      throw error;
    }
  }, [navigation]);

  const customHandlers = useMemo(
    () => ({
      "custom.close": async () => {
        await handleClose();
      },
    }),
    [handleClose],
  );

  return (
    <ScopeProvider atoms={[currentAccountAtom]}>
      <SafeAreaView style={[styles.root, { paddingTop: 0 }]}>
        <Web3AppWebview
          ref={webviewAPIRef}
          manifest={manifest}
          inputs={inputs}
          allowsBackForwardNavigationGestures={false}
          customHandlers={customHandlers}
          onStateChange={setWebviewState}
        />
        <ProviderInterstitial
          manifest={manifest}
          isLoading={webviewState.loading}
          description={t("transfer.receive.connectToNoah")}
        />
      </SafeAreaView>
    </ScopeProvider>
  );
};

export default WebReceivePlayer;

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
