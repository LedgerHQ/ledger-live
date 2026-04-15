import React, { memo, useRef, useCallback } from "react";
import { StyleSheet } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { BAANX_TOKEN_EXTRACTION_JS } from "@ledgerhq/baanx";
import SafeAreaView from "~/components/SafeAreaView";
import { TrackScreen } from "~/analytics";
import type { BaanxLoginViewModel } from "./useBaanxLoginViewModel";

const BaanxLoginScreenView = ({ webAppUrl, onWebViewMessage }: BaanxLoginViewModel) => {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (event.nativeEvent?.data) {
        onWebViewMessage(event.nativeEvent.data);
      }
    },
    [onWebViewMessage],
  );

  return (
    <SafeAreaView isFlex>
      <TrackScreen name="BaanxCardLogin" />
      <WebView
        ref={webViewRef}
        source={{ uri: webAppUrl }}
        style={styles.webview}
        injectedJavaScript={BAANX_TOKEN_EXTRACTION_JS}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        sharedCookiesEnabled
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});

export default memo(BaanxLoginScreenView);
