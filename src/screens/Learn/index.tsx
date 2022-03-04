import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native";
import WebView from "react-native-webview";
import { URLSearchParams } from 'react-native-url-polyfill';
import styled, { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import NetInfo from "@react-native-community/netinfo";
import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import LoadingView from "./LoadingScreen";
import NoConnectionErrorScreen from "./NoConnectionErrorScreen";
import { Track } from "../../analytics";
import { lightTheme, darkTheme } from "../../colors";

const learnProdURL = "https://www.ledger.com/ledger-live-learn";
const learnStagingURL =
  "https://ecommerce-website.aws.stg.ldg-tech.com/ledger-live-learn";

const SafeContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${p => p.theme.colors.background.main};
  padding-top: ${extraStatusBarPadding}px;
`;

const StyledWebview = styled(WebView)`
  background-color: transparent; // avoids white background before page loads
`;

export default function Learn() {
  const { i18n } = useTranslation();
  const {
    colors: { type: themeType },
  } = useTheme();

  const useStagingURL = useEnv("USE_LEARN_STAGING_URL");

  const params = new URLSearchParams({
    theme: themeType,
    lang: i18n.languages[0],
    pagePaddingLeft: "16px",
    pagePaddingRight: "16px",
    darkBackgroundColor: `${darkTheme.colors.background}`, // TODO: update in v3
    lightBackgroundColor: `${lightTheme.colors.background}`, // TODO: update in v3
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
            style={loading && { height: 0 }}
            source={{ uri }}
            onLoadEnd={handleOnLoad}
            renderError={renderError}
          />
        </>
      ) : (
        <NoConnectionErrorScreen />
      )}
    </SafeContainer>
  );
}
