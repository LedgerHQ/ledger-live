import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { RefObject, useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  BackHandler,
} from "react-native";
import { WebView as RNWebView } from "react-native-webview";

import { useTheme } from "styled-components/native";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { useNavigation } from "@react-navigation/native";
import { TopBarRenderFunc, WebviewState } from "../Web3AppWebview/types";

import UpdateIcon from "../../icons/Update";
import InfoIcon from "../../icons/Info";
import Web3AppWebview from "../Web3AppWebview";
import InfoPanel from "./InfoPanel";

type Props = {
  manifest: LiveAppManifest;
  inputs?: Record<string, string>;
};

const ReloadButton = ({
  onReload,
  loading,
}: {
  onReload: () => void;
  loading: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={styles.buttons}
      disabled={loading}
      onPress={() => !loading && onReload()}
    >
      <UpdateIcon size={18} color={colors.neutral.c70} />
    </TouchableOpacity>
  );
};

const InfoPanelButton = ({
  loading,
  setIsInfoPanelOpened,
}: {
  loading: boolean;
  setIsInfoPanelOpened: (_: boolean) => void;
}) => {
  const { colors } = useTheme();

  const onPress = () => {
    setIsInfoPanelOpened(true);
  };

  return (
    <TouchableOpacity
      style={styles.buttons}
      disabled={loading}
      onPress={onPress}
    >
      <InfoIcon size={18} color={colors.neutral.c70} />
    </TouchableOpacity>
  );
};

type TopBarProps = {
  manifest: AppManifest;
  webviewRef: RefObject<RNWebView>;
  webviewState: WebviewState;
};

function TopBar({ manifest, webviewRef, webviewState }: TopBarProps) {
  const [isInfoPanelOpened, setIsInfoPanelOpened] = useState(false);

  const handleBackButton = useCallback(() => {
    const webview = webviewRef.current;
    if (!webview || !webviewState.canGoBack) {
      return false;
    }

    webview.goBack();
    return true;
  }, [webviewState.canGoBack, webviewRef]);

  const navigation = useNavigation();

  useEffect(() => {
    const func = (e: { preventDefault: () => void }) => {
      const result = handleBackButton();
      if (result) {
        e.preventDefault();
      }
    };

    navigation.addListener("beforeRemove", func);

    return () => {
      navigation.removeListener("beforeRemove", func);
    };
  }, [handleBackButton, navigation]);

  const handleReload = useCallback(() => {
    const webview = webviewRef.current;
    if (!webview) {
      return;
    }

    webview.reload();
  }, [webviewRef]);

  useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", handleBackButton);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBackButton);
    };
  }, [handleBackButton]);

  return (
    <>
      <View style={styles.headerRight}>
        <ReloadButton onReload={handleReload} loading={false} />
        <InfoPanelButton
          loading={false}
          setIsInfoPanelOpened={setIsInfoPanelOpened}
        />
      </View>
      <InfoPanel
        name={manifest.name}
        icon={manifest.icon}
        url={manifest.homepageUrl}
        uri={webviewState.url.toString()}
        description={manifest.content.description}
        isOpened={isInfoPanelOpened}
        setIsOpened={setIsInfoPanelOpened}
      />
    </>
  );
}

const WebViewWrapper = ({ manifest, inputs }: Props) => {
  const renderTopBar = useCallback<TopBarRenderFunc>(
    (manifest, webviewRef, webviewState) => (
      <TopBar
        manifest={manifest}
        webviewRef={webviewRef}
        webviewState={webviewState}
      />
    ),
    [],
  );

  return (
    <SafeAreaView style={[styles.root]}>
      <Web3AppWebview
        manifest={manifest}
        inputs={inputs}
        renderTopBar={renderTopBar}
      />
    </SafeAreaView>
  );
};

export default WebViewWrapper;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
