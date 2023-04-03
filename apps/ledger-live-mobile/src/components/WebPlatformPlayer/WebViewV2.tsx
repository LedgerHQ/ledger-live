import React, { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  SafeAreaView,
} from "react-native";
import { WebView as RNWebView } from "react-native-webview";
import { InfoPanel } from "./InfoPanel";
import { useWebView } from "./hooks";
import { RootProps } from "./types";
import { BottomNav } from "./BottomNav";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";

export function WebView({ manifest, inputs, hideHeader = false }: RootProps) {
  const {
    uri,
    isInfoPanelOpened,
    setIsInfoPanelOpened,
    webviewRef,
    onLoad,
    onReload,
    onMessage,
    onLoadError,
    onNavStateChange,
    navColors,
    navState,
  } = useWebView({
    manifest,
    inputs,
    hideHeader,
  });

  const source = useMemo(() => {
    return {
      uri,
    };
  }, [uri]);

  return (
    <SafeAreaView
      style={[
        styles.root,
        { paddingTop: hideHeader ? extraStatusBarPadding : 0 },
      ]}
    >
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
        onNavigationStateChange={onNavStateChange}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        renderLoading={Loading}
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

      <BottomNav
        navState={navState}
        navColors={navColors}
        goBack={() => webviewRef.current?.goBack()}
        goForward={() => webviewRef.current?.goForward()}
        onReload={onReload}
      />
    </SafeAreaView>
  );
}

function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
});
