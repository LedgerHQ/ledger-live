import React, { forwardRef, useState } from "react";
import VersionNumber from "react-native-version-number";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { WebView as RNWebView } from "react-native-webview";
import Config from "react-native-config";
import { WebviewAPI, WebviewProps } from "./types";
import { useWebView } from "./helpers";
import { NetworkError } from "./NetworkError";
import { INTERNAL_APP_IDS, WC_ID } from "@ledgerhq/live-common/wallet-api/constants";
import { useInternalAppIds } from "@ledgerhq/live-common/hooks/useInternalAppIds";
import { INJECTED_JAVASCRIPT } from "./dappInject";
import { NoAccountScreen } from "./NoAccountScreen";

const APPLICATION_NAME = `ledgerlivemobile/${VersionNumber.appVersion} llm-${Platform.OS}/${VersionNumber.appVersion}`;

export const WalletAPIWebview = forwardRef<WebviewAPI, WebviewProps>(
  (
    {
      manifest,
      currentAccountHistDb,
      inputs = {},
      customHandlers,
      onStateChange,
      allowsBackForwardNavigationGestures = true,
      onScroll,
      Loader = DefaultLoader,
    },
    ref,
  ) => {
    const {
      onMessage,
      onLoadError,
      onOpenWindow,
      webviewProps,
      webviewRef,
      webviewCacheOptions,
      noAccounts,
    } = useWebView(
      {
        manifest,
        inputs,
        customHandlers,
        currentAccountHistDb,
      },
      ref,
      onStateChange,
    );
    const [error, setError] = useState(false);

    const reloadWebView = () => {
      setError(false);
      webviewRef.current?.reload();
    };

    const internalAppIds = useInternalAppIds() || INTERNAL_APP_IDS;

    const javaScriptCanOpenWindowsAutomatically =
      internalAppIds.includes(manifest.id) || manifest.id === WC_ID;

    if (!!manifest.dapp && noAccounts) {
      return <NoAccountScreen manifest={manifest} currentAccountHistDb={currentAccountHistDb} />;
    }

    return (
      <RNWebView
        ref={webviewRef}
        onScroll={onScroll}
        decelerationRate={Platform.OS === "ios" ? "normal" : 0.998}
        startInLoadingState={true}
        showsHorizontalScrollIndicator={false}
        allowsBackForwardNavigationGestures={allowsBackForwardNavigationGestures}
        showsVerticalScrollIndicator={false}
        renderLoading={Loader}
        originWhitelist={manifest.domains}
        allowsInlineMediaPlayback
        onMessage={onMessage}
        onError={() => {
          onLoadError();
          setError(true);
        }}
        onOpenWindow={onOpenWindow}
        overScrollMode="content"
        bounces={false}
        mediaPlaybackRequiresUserAction={false}
        automaticallyAdjustContentInsets={false}
        scrollEnabled={true}
        style={[styles.webview, { display: error ? "none" : "flex" }]}
        renderError={() => <NetworkError handleTryAgain={reloadWebView} />}
        testID="wallet-api-webview"
        applicationNameForUserAgent={APPLICATION_NAME}
        webviewDebuggingEnabled={__DEV__}
        allowsUnsecureHttps={__DEV__ && !!Config.IGNORE_CERTIFICATE_ERRORS}
        javaScriptCanOpenWindowsAutomatically={javaScriptCanOpenWindowsAutomatically}
        injectedJavaScriptBeforeContentLoaded={manifest.dapp ? INJECTED_JAVASCRIPT : undefined}
        {...webviewProps}
        {...webviewCacheOptions}
      />
    );
  },
);

WalletAPIWebview.displayName = "WalletAPIWebview";

function DefaultLoader() {
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
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
});
