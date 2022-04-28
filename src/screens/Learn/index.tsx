import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import { SafeAreaView } from "react-native";
import WebView from "react-native-webview";
import { URLSearchParams } from "react-native-url-polyfill";
import styled, { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import NetInfo from "@react-native-community/netinfo";
import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
import { useNavigation } from "@react-navigation/native";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import LoadingView from "./LoadingScreen";
import NoConnectionErrorScreen from "./NoConnectionErrorScreen";
import { Track } from "../../analytics";

const learnProdURL = "https://www.ledger.com/ledger-live-learn";
const learnStagingURL = "https://www-ppr.ledger.com/ledger-live-learn";

const SafeContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${p => p.theme.colors.background.main};
  padding-top: ${extraStatusBarPadding}px;
`;

const StyledWebview = styled(WebView)`
  background-color: transparent; // avoids white background before page loads
`;

function Learn() {
  const { i18n } = useTranslation();
  const navigation = useNavigation();
  const [canGoBack, setCanGoBack] = useState(true);
  const {
    colors: { type: themeType },
  } = useTheme();

  const useStagingURL = useEnv("USE_LEARN_STAGING_URL");
  const ref = useRef<WebView>(null);

  const params = new URLSearchParams({
    theme: themeType,
    lang: i18n.languages[0],
  });

  const uri = `${
    useStagingURL ? learnStagingURL : learnProdURL
  }?${params.toString()}`;

  const [initialLoadingDone, setInitialLoadingDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasNetwork, setHasNetwork] = useState(true);

  useEffect(() => {
    setInitialLoadingDone(false);
    setLoading(true);
  }, [uri, setInitialLoadingDone, setLoading]);

  useEffect(() => {
    NetInfo.fetch().then(state => {
      if (!state.isConnected) setHasNetwork(false);
    });
  }, []);

  useEffect(() => {
    navigation.addListener("beforeRemove", e => {
      if (canGoBack) return;
      // Prevent default behavior of leaving the screen
      e.preventDefault();
      ref.current?.goBack();
    });

    return () => {
      navigation.removeListener("beforeRemove");
    };
  }, [canGoBack, navigation]);

  const handleOnLoad = useCallback(() => {
    if (initialLoadingDone) return;
    setInitialLoadingDone(true);
    setLoading(false);
  }, [initialLoadingDone, setInitialLoadingDone, setLoading]);

  const renderError = useCallback(() => <NoConnectionErrorScreen />, []);

  return (
    <SafeContainer>
      <Track onMount event="Page Learn" />
      {hasNetwork ? (
        <>
          {loading && <LoadingView />}
          <StyledWebview
            ref={ref}
            style={loading && { height: 0 }}
            source={{ uri }}
            onLoadEnd={handleOnLoad}
            renderError={renderError}
            startInLoadingState
            allowsBackForwardNavigationGestures
            onNavigationStateChange={navState => {
              setCanGoBack(!navState.canGoBack);
            }}
          />
        </>
      ) : (
        <NoConnectionErrorScreen />
      )}
    </SafeContainer>
  );
}

export default memo(Learn);
