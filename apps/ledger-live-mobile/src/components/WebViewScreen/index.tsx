import React, { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import NetInfo from "@react-native-community/netinfo";
import { useNavigation } from "@react-navigation/native";
import styled from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";
import { Track } from "~/analytics";
import WebViewNoConnectionError from "./NoConnectionError";
import WebViewLoading from "./Loading";
import { SafeAreaView } from "react-native";

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
  renderError?: () => JSX.Element;
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
              onMessage={onMessage}
              onLoadEnd={handleOnLoad}
              renderError={renderError || defaultRenderError}
              startInLoadingState
              javaScriptCanOpenWindowsAutomatically
              allowsBackForwardNavigationGestures
              mediaPlaybackRequiresUserAction
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
