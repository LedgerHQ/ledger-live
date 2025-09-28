import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet, SafeAreaView, BackHandler, Platform } from "react-native";
import { ScopeProvider } from "jotai-scope";

import { useNavigation } from "@react-navigation/native";
import { currentAccountAtom } from "@ledgerhq/live-common/wallet-api/useDappLogic";
import { WebviewAPI } from "../Web3AppWebview/types";

import { Web3AppWebview } from "../Web3AppWebview";
import { RootNavigationComposite, StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";

import { NavigatorName } from "~/const";

type Props = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string | undefined>;
};

const WebReceivePlayer = ({ manifest, inputs }: Props) => {
  const webviewAPIRef = useRef<WebviewAPI>(null);

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

  navigation.setOptions({
    headerRight: () => null,
    headerLeft: () => null,
    headerTitle: () => null,
    headerShown: true,
  });

  return (
    <ScopeProvider atoms={[currentAccountAtom]}>
      <SafeAreaView style={[styles.root, { paddingTop: 0 }]}>
        <Web3AppWebview
          ref={webviewAPIRef}
          manifest={manifest}
          inputs={inputs}
          allowsBackForwardNavigationGestures={false}
          customHandlers={{
            "custom.close": () => {
              navigation.popTo(NavigatorName.Base, {
                screen: NavigatorName.Main,
              });
            },
          }}
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
