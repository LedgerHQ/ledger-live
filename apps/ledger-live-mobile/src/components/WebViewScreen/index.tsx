import React, { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import NetInfo from "@react-native-community/netinfo";
import { useNavigation } from "@react-navigation/native";
import styled from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";
import { Track } from "~/analytics";
import WebViewNoConnectionError from "./NoConnectionError";
import WebViewLoading from "./Loading";
import { SafeAreaView } from "react-native";
import Config from "react-native-config";
import {
  E2E_WEBVIEW_CONSOLE_LOG_TYPE,
  E2E_WEBVIEW_NETWORK_CAPTURE_SCRIPT,
  E2E_WEBVIEW_NETWORK_LOG_TYPE,
} from "~/e2e/webviewNetworkLogCapture";
import { webviewLogStore } from "~/e2e/webviewLogStore";

const SafeContainer = styled(SafeAreaView)`
  flex: 1;
  flex-grow: 1;
  background-color: ${p => p.theme.colors.background.main};
`;

export type Props = {
  uri: string;
  screenName: string;
  trackEventName?: string;
  onMessage?: (_: WebViewMessageEvent) => void;
  renderHeader?: () => ReactNode;
  renderLoading?: () => ReactNode;
  renderError?: () => React.JSX.Element;
  enableNavigationOverride?: boolean;
};

const WebViewScreen = ({
  uri,
  screenName,
  trackEventName,
  onMessage,
  renderHeader,
  renderLoading,
  renderError,
  enableNavigationOverride = true,
}: Props) => {
  const ref = useRef<WebView>(null);
  const navigation = useNavigation();
  const [canGoBack, setCanGoBack] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hasNetwork, setHasNetwork] = useState(true);

  useEffect(() => {
    NetInfo.fetch().then(state => {
      if (!state.isConnected) setHasNetwork(false);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
  }, [uri, setLoading]);

  useEffect(() => {
    if (!enableNavigationOverride) return undefined;
    const unsubscribe = navigation.addListener("beforeRemove", e => {
      if (canGoBack) return;
      // Prevent default behavior of leaving the screen
      e.preventDefault();
      ref.current?.goBack();
    });

    return unsubscribe;
  }, [canGoBack, enableNavigationOverride, navigation]);

  const handleOnLoad = useCallback(() => {
    setLoading(false);
  }, [setLoading]);

  const defaultRenderLoading = useCallback(() => <WebViewLoading />, []);

  const defaultRenderError = useCallback(
    () => <WebViewNoConnectionError screenName={screenName} />,
    [screenName],
  );

  const handleMessage = useCallback(
    (e: WebViewMessageEvent) => {
      if (Config.DETOX && e.nativeEvent?.data) {
        try {
          const msg = JSON.parse(e.nativeEvent.data);
          if (msg.type === E2E_WEBVIEW_NETWORK_LOG_TYPE) {
            webviewLogStore.addNetworkLog(msg.payload);
            return;
          }
          if (msg.type === E2E_WEBVIEW_CONSOLE_LOG_TYPE) {
            webviewLogStore.addConsoleLog(msg.payload);
            return;
          }
        } catch {
          // not our message
        }
      }
      onMessage?.(e);
    },
    [onMessage],
  );

  const handleError = useCallback(
    (event?: { nativeEvent?: { description?: string; code?: number } }) => {
      if (Config.DETOX) {
        const desc = event?.nativeEvent?.description;
        const code = event?.nativeEvent?.code;
        webviewLogStore.addLoadError({
          timestamp: new Date().toISOString(),
          source: "WebViewScreen",
          message: desc ?? "WebView onError fired",
          details: `uri=${uri} screenName=${screenName}${code != null ? ` code=${code}` : ""}`,
        });
      }
    },
    [uri, screenName],
  );

  return (
    <SafeContainer>
      {renderHeader && renderHeader()}
      {trackEventName && <Track onMount event={trackEventName} />}

      <Flex flex={1}>
        {hasNetwork ? (
          <>
            <WebView
              ref={ref}
              source={{ uri }}
              style={{ backgroundColor: "transparent" }}
              onMessage={handleMessage}
              onLoadEnd={handleOnLoad}
              onError={handleError}
              renderError={renderError || defaultRenderError}
              startInLoadingState
              javaScriptCanOpenWindowsAutomatically
              allowsBackForwardNavigationGestures
              mediaPlaybackRequiresUserAction
              injectedJavaScriptBeforeContentLoaded={
                Config.DETOX ? E2E_WEBVIEW_NETWORK_CAPTURE_SCRIPT : undefined
              }
              onNavigationStateChange={(navState: { canGoBack: boolean }) => {
                setCanGoBack(!navState.canGoBack);
              }}
            />
            {loading ? (
              <Flex
                position="absolute"
                width="100%"
                height="100%"
                top={0}
                left={0}
                bg="background.main"
              >
                {renderLoading ? renderLoading() : defaultRenderLoading()}
              </Flex>
            ) : null}
          </>
        ) : renderError ? (
          renderError()
        ) : (
          defaultRenderError()
        )}
      </Flex>
    </SafeContainer>
  );
};

export default WebViewScreen;
