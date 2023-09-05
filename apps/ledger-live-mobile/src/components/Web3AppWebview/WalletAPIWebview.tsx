import React, { forwardRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView as RNWebView } from "react-native-webview";
import Config from "react-native-config";
import { WebviewAPI, WebviewProps } from "./types";
import { useWebView } from "./helpers";
import { NetworkError } from "./NetworkError";

export const WalletAPIWebview = forwardRef<WebviewAPI, WebviewProps>(
  ({ manifest, inputs = {}, onStateChange, allowsBackForwardNavigationGestures = true }, ref) => {
    const { onMessage, onLoadError, webviewProps, webviewRef } = useWebView(
      {
        manifest,
        inputs,
      },
      ref,
      onStateChange,
    );

    return (
      <RNWebView
        ref={webviewRef}
        startInLoadingState={true}
        showsHorizontalScrollIndicator={false}
        allowsBackForwardNavigationGestures={allowsBackForwardNavigationGestures}
        showsVerticalScrollIndicator={false}
        renderLoading={renderLoading}
        originWhitelist={manifest.domains}
        allowsInlineMediaPlayback
        onMessage={onMessage}
        onError={onLoadError}
        overScrollMode="content"
        bounces={false}
        mediaPlaybackRequiresUserAction={false}
        automaticallyAdjustContentInsets={false}
        scrollEnabled={true}
        style={styles.webview}
        renderError={() => <NetworkError handleTryAgain={() => webviewRef.current?.reload()} />}
        testID="wallet-api-webview"
        allowsUnsecureHttps={__DEV__ && !!Config.IGNORE_CERTIFICATE_ERRORS}
        {...webviewProps}
      />
    );
  },
);

WalletAPIWebview.displayName = "WalletAPIWebview";

function renderLoading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="small" />
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
  webview: {
    flex: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
});
