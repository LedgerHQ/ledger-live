import React, { useCallback, useRef } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import {
  BAANX_WEB_APP_URL,
  BAANX_TOKEN_EXTRACTION_JS,
  parseBaanxWebViewMessage,
} from "@ledgerhq/baanx";
import { TrackScreen } from "~/analytics";
import { useBaanxAuth } from "../../Navigator";

export function BaanxLoginScreen() {
  const { setAccessToken } = useBaanxAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tokenExtracted = useRef(false);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (tokenExtracted.current) return;

      const result = parseBaanxWebViewMessage(event.nativeEvent.data);
      if (!result) return;

      tokenExtracted.current = true;
      setAccessToken(result.accessToken);
    },
    [setAccessToken],
  );

  const renderLoading = useCallback(
    () => (
      <View style={[StyleSheet.absoluteFill, styles.loader]}>
        <ActivityIndicator size="large" color={theme.colors.text.base} />
      </View>
    ),
    [theme.colors.text.base],
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg.base, paddingTop: insets.top }]}>
      <TrackScreen name="BaanxLogin" />
      <WebView
        source={{ uri: BAANX_WEB_APP_URL }}
        injectedJavaScript={BAANX_TOKEN_EXTRACTION_JS}
        onMessage={onMessage}
        startInLoadingState
        renderLoading={renderLoading}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loader: {
    alignItems: "center",
    justifyContent: "center",
  },
});
